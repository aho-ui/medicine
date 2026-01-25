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

    try:
        files = {"image": ("image.jpg", image_bytes, "image/jpeg")}
        response = requests.post(f"{api_url}/api/verify", files=files, timeout=30)
        return response.json()
    except requests.exceptions.ConnectionError:
        raise Exception("Vision server not reachable. Make sure Flask server is running on port 5000")
    except requests.exceptions.Timeout:
        raise Exception("Vision server timeout. Flask server may be overloaded")
    except Exception as e:
        raise Exception(f"Vision server error: {str(e)}")
