import requests
from django.conf import settings


def call_colab_api():
    api_url = settings.COLAB_API_URL

    if not api_url:
        return {"status": "error", "message": "COLAB_API_URL not set"}

    try:
        response = requests.get(f"{api_url}/", timeout=5)
        return response.json()
    except Exception as e:
        return {"status": "error", "message": str(e)}


def verify_with_colab(image_bytes):
    api_url = settings.COLAB_API_URL

    if not api_url:
        raise Exception("COLAB_API_URL not set")

    files = {"image": ("image.jpg", image_bytes, "image/jpeg")}
    response = requests.post(f"{api_url}/api/verify", files=files, timeout=30)
    return response.json()
