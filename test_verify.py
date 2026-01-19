import requests
import hashlib

BASE_URL = "http://127.0.0.1:8000/vision"

def test_record_and_get():
    """Test blockchain record with predetermined data (no Colab)"""

    # Predetermined test data
    fake_image = b"test_medicine_image_12345"
    image_hash = hashlib.sha256(fake_image).hexdigest()
    result = "GENUINE"
    confidence = 0.92

    print("=== Test Data ===")
    print(f"Image hash: {image_hash}")
    print(f"Result: {result}")
    print(f"Confidence: {confidence}")
    print()

    # Step 1: Record to blockchain
    print("=== Recording to Blockchain ===")
    data = {
        "image_hash": image_hash,
        "result": result,
        "confidence": confidence
    }

    response = requests.post(f"{BASE_URL}/blockchain/record/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    if response.status_code != 200:
        print("Recording failed!")
        return

    verification_id = response.json().get("verification_id")
    print()

    # Step 2: Retrieve from blockchain
    print(f"=== Retrieving Verification {verification_id} ===")
    response = requests.get(f"{BASE_URL}/blockchain/verification/{verification_id}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    # Step 3: List all verifications
    print("=== All Verifications ===")
    response = requests.get(f"{BASE_URL}/blockchain/verifications/")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total: {len(data.get('verifications', []))} records")
    for v in data.get("verifications", []):
        print(f"  ID {data['verifications'].index(v)}: {v['result']} ({v['confidence']})")


if __name__ == "__main__":
    test_record_and_get()
