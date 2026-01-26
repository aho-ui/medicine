import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Count
from .services import call_colab_api, verify_with_colab
from .models import VisionInspection
from blockchain.utils import record_verification, get_verification, get_all_verifications, hash_image


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
        "verification_id": tx_result["verification_id"]
    }


@csrf_exempt
@require_http_methods(["POST"])
def verify_and_record(request):
    if "image" not in request.FILES:
        return JsonResponse({"error": "No image provided"}, status=400)

    try:
        image_bytes = request.FILES["image"].read()

        verification = verify(image_bytes)

        if len(verification["detections"]) == 0:
            return JsonResponse({
                "detections": [],
                "blockchain": None
            })

        # Save each detection to VisionInspection
        for detection in verification["detections"]:
            VisionInspection.objects.create(
                result=detection["result"].upper(),
                confidence=detection["cnn_confidence"],
                bbox=detection["bbox"],
                hash=verification["image_hash"]
            )

        blockchain = record(
            verification["image_hash"],
            verification["detections"]
        )

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
def verification_stats(request):
    """Get verification statistics from VisionInspection."""
    try:
        # Count by result type
        counts = VisionInspection.objects.values("result").annotate(count=Count("id"))
        stats = {"genuine": 0, "suspicious": 0, "counterfeit": 0}
        for item in counts:
            key = item["result"].lower()
            if key in stats:
                stats[key] = item["count"]

        # Get recent inspections (last 10)
        recent = VisionInspection.objects.order_by("-created_at")[:10]
        recent_list = [
            {
                "id": str(inspection.id),
                "result": inspection.result,
                "confidence": inspection.confidence,
                "created_at": inspection.created_at.isoformat(),
                "hash": inspection.hash[:16] + "..."
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
