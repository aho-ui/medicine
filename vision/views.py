import json
import io
from PIL import Image as PILImage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Count
from django.core.files.base import ContentFile
from .services import call_colab_api, verify_with_colab
from .models import VisionInspection
from blockchain.utils import record_verification, get_verification, get_all_verifications, hash_image
from core.utils import log_action
from core.models import MedicineLot


def test_colab_connection(request):
    result = call_colab_api()
    return JsonResponse(result)


def verify(image_bytes):
    colab_result = verify_with_colab(image_bytes)
    image_hash = hash_image(image_bytes)
    return {
        "detections": colab_result.get("detections", []),
        "image_hash": image_hash
    }


def record(image_hash, detections):
    tx_result = record_verification(image_hash, detections)
    return {
        "tx_hash": tx_result["tx_hash"],
        "block": tx_result["block"],
        "verification_id": tx_result["verification_id"],
        "already_verified": tx_result["already_verified"]
    }


@csrf_exempt
@require_http_methods(["POST"])
def verify_and_record(request):
    if "image" not in request.FILES:
        return JsonResponse({"error": "No image provided"}, status=400)

    try:
        uploaded = request.FILES["image"]
        image_bytes = uploaded.read()
        original_name = uploaded.name
        lot_id = request.POST.get("lot_id")

        lot = None
        if lot_id:
            try:
                lot = MedicineLot.objects.get(id=lot_id)
            except MedicineLot.DoesNotExist:
                return JsonResponse({"error": "Lot not found"}, status=404)

        verification = verify(image_bytes)

        if len(verification["detections"]) == 0:
            return JsonResponse({
                "detections": [],
                "blockchain": None
            })

        source_num = VisionInspection.objects.values("hash").distinct().count() + 1
        source_image = PILImage.open(io.BytesIO(image_bytes))

        for i, detection in enumerate(verification["detections"]):
            x1, y1, x2, y2 = detection["bbox"]
            cropped = source_image.crop((x1, y1, x2, y2))
            buf = io.BytesIO()
            cropped.save(buf, format="JPEG")
            cropped_bytes = buf.getvalue()

            inspection = VisionInspection(
                result=detection["result"].upper(),
                confidence=detection["cnn_confidence"],
                bbox=detection["bbox"],
                hash=verification["image_hash"],
                image_name=f"record_{source_num}_{i + 1}",
                user=request.user if request.user.is_authenticated else None,
                lot=lot,
            )
            inspection.image.save(
                f"{verification['image_hash']}_{i + 1}.jpg",
                ContentFile(cropped_bytes),
                save=True,
            )

        blockchain = record(
            verification["image_hash"],
            verification["detections"]
        )
        log_action("VERIFY", "Verified medicine image", user=request.user if request.user.is_authenticated else None, target_id=blockchain["verification_id"])
        return JsonResponse({
            "detections": verification["detections"],
            "blockchain": blockchain
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def record_to_blockchain(request):
    try:
        data = json.loads(request.body)
        image_hash = data.get("image_hash")
        result = data.get("result")
        confidence = data.get("confidence")

        if not all([image_hash, result, confidence]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        tx_result = record(image_hash, result, confidence)
        return JsonResponse(tx_result)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def get_blockchain_verification(request, verification_id):
    try:
        verification = get_verification(verification_id)
        return JsonResponse(verification)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=404)


@require_http_methods(["GET"])
def list_blockchain_verifications(request):
    try:
        verifications = get_all_verifications()
        return JsonResponse({"verifications": verifications})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def lot_verifications(request, lot_id):
    try:
        lot = MedicineLot.objects.get(id=lot_id)
    except MedicineLot.DoesNotExist:
        return JsonResponse({"error": "Lot not found"}, status=404)

    # Only return approved verifications for lot details
    inspections = VisionInspection.objects.filter(lot=lot, status="APPROVED").order_by("-created_at")
    records = [
        {
            "id": str(r.id),
            "result": r.result,
            "confidence": r.confidence,
            "created_at": r.created_at.isoformat(),
            "hash": r.hash[:16] + "...",
            "image_name": r.image_name,
            "image": r.image.url if r.image else None,
            "status": r.status,
        }
        for r in inspections
    ]
    return JsonResponse({"verifications": records})


@csrf_exempt
@require_http_methods(["POST"])
def approve_verification(request, verification_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        inspection = VisionInspection.objects.get(id=verification_id)
    except VisionInspection.DoesNotExist:
        return JsonResponse({"error": "Verification not found"}, status=404)

    data = json.loads(request.body) if request.body else {}
    action = data.get("action", "approve")

    if action == "approve":
        inspection.status = "APPROVED"
        log_action("APPROVE", "Approved verification", user=request.user, target_id=str(inspection.id))
    elif action == "reject":
        inspection.status = "REJECTED"
        log_action("REJECT", "Rejected verification", user=request.user, target_id=str(inspection.id))
    else:
        return JsonResponse({"error": "Invalid action"}, status=400)

    inspection.save()
    return JsonResponse({"status": inspection.status, "id": str(inspection.id)})


@require_http_methods(["GET"])
def pending_verifications(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    qs = VisionInspection.objects.filter(status="PENDING")
    if request.user.role != "ADMIN":
        qs = qs.filter(user=request.user)

    records = [
        {
            "id": str(r.id),
            "result": r.result,
            "confidence": r.confidence,
            "created_at": r.created_at.isoformat(),
            "hash": r.hash[:16] + "...",
            "image_name": r.image_name,
            "image": r.image.url if r.image else None,
            "status": r.status,
            "lot_id": str(r.lot.id) if r.lot else None,
            "lot_number": r.lot.lot_number if r.lot else None,
        }
        for r in qs.order_by("-created_at")
    ]
    return JsonResponse({"verifications": records})


@csrf_exempt
@require_http_methods(["POST"])
def link_verification(request, verification_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    try:
        inspection = VisionInspection.objects.get(id=verification_id)
    except VisionInspection.DoesNotExist:
        return JsonResponse({"error": "Verification not found"}, status=404)

    data = json.loads(request.body)
    lot_id = data.get("lot_id")
    if not lot_id:
        return JsonResponse({"error": "lot_id required"}, status=400)

    try:
        lot = MedicineLot.objects.get(id=lot_id)
    except MedicineLot.DoesNotExist:
        return JsonResponse({"error": "Lot not found"}, status=404)

    inspection.lot = lot
    inspection.save()
    log_action("LINK", "Linked verification to lot", user=request.user, target_id=str(inspection.id))
    return JsonResponse({"status": "linked", "id": str(inspection.id), "lot_id": str(lot.id)})


@require_http_methods(["GET"])
def unlinked_verifications(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)

    qs = VisionInspection.objects.filter(lot__isnull=True)
    if request.user.role != "ADMIN":
        qs = qs.filter(user=request.user)

    records = [
        {
            "id": str(r.id),
            "result": r.result,
            "confidence": r.confidence,
            "created_at": r.created_at.isoformat(),
            "hash": r.hash[:16] + "...",
            "image_name": r.image_name,
            "image": r.image.url if r.image else None,
        }
        for r in qs.order_by("-created_at")
    ]
    return JsonResponse({"verifications": records})


@require_http_methods(["GET"])
def verification_stats(request):
    try:
        result_filter = request.GET.get("result")

        qs = VisionInspection.objects.all()
        if request.user.is_authenticated and request.user.role != "ADMIN":
            qs = qs.filter(user=request.user)

        if result_filter:
            filtered = qs.filter(result=result_filter.upper()).order_by("-created_at")
            records = [
                {
                    "id": str(r.id),
                    "result": r.result,
                    "confidence": r.confidence,
                    "created_at": r.created_at.isoformat(),
                    "hash": r.hash[:16] + "...",
                    "image_name": r.image_name,
                    "image": r.image.url if r.image else None,
                }
                for r in filtered
            ]
            return JsonResponse({"records": records})

        counts = qs.values("result").annotate(count=Count("id"))
        stats = {"genuine": 0, "suspicious": 0, "counterfeit": 0}
        for item in counts:
            key = item["result"].lower()
            if key in stats:
                stats[key] = item["count"]

        recent = qs.order_by("-created_at")[:10]
        recent_list = [
            {
                "id": str(inspection.id),
                "result": inspection.result,
                "confidence": inspection.confidence,
                "created_at": inspection.created_at.isoformat(),
                "hash": inspection.hash[:16] + "...",
                "image_name": inspection.image_name,
                "image": inspection.image.url if inspection.image else None,
            }
            for inspection in recent
        ]

        return JsonResponse({
            "stats": stats,
            "recent": recent_list,
            "total": sum(stats.values())
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
