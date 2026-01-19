import requests
import hashlib

BASE_URL = "http://127.0.0.1:8000/vision"

def test_record():
    fake_image_hash = hashlib.sha256(b"test_image_data").hexdigest()

    data = {
        "image_hash": fake_image_hash,
        "result": "GENUINE",
        "confidence": 0.95
    }

    response = requests.post(f"{BASE_URL}/blockchain/record/", json=data)
    print("Record Response:")
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")
    if response.status_code == 200:
        return response.json()
    return {}


def test_get(verification_id):
    response = requests.get(f"{BASE_URL}/blockchain/verification/{verification_id}/")
    print(f"\nGet Verification {verification_id}:")
    print(response.json())


def test_list():
    response = requests.get(f"{BASE_URL}/blockchain/verifications/")
    print("\nAll Verifications:")
    print(response.json())


if __name__ == "__main__":
    result = test_record()
    if "verification_id" in result:
        test_get(result["verification_id"])
    test_list()
