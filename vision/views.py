import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services import call_colab_api, verify_with_colab
from blockchain.utils import record_verification, get_verification, get_all_verifications, hash_image


def test_colab_connection(request):
    result = call_colab_api()
    return JsonResponse(result)


def verify(image_bytes):
    colab_result = verify_with_colab(image_bytes)
    image_hash = hash_image(image_bytes)
    return {
        "result": colab_result.get("result"),
        "confidence": colab_result.get("confidence"),
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

        if verification["result"] is None or len(verification["detections"]) == 0:
            return JsonResponse({
                "result": None,
                "confidence": 0.0,
                "detections": [],
                "blockchain": None
            })

        blockchain = record(
            verification["image_hash"],
            verification["detections"]
        )

        return JsonResponse({
            "result": verification["result"],
            "confidence": verification["confidence"],
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
