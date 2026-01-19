import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

COLAB_API_URL = os.getenv('COLAB_API_URL')
DATASET_PATH = Path(__file__).parent / "dataset" / "dataset_yolo" / "test" / "images"

def test_verify_endpoint():
    if not COLAB_API_URL:
        print("Error: COLAB_API_URL not found in .env")
        return

    test_images = list(DATASET_PATH.glob("*.jpg"))

    if not test_images:
        print(f"No test images found in {DATASET_PATH}")
        return

    test_image = test_images[0]
    print(f"Testing with image: {test_image.name}")
    print(f"API URL: {COLAB_API_URL}/api/verify\n")

    with open(test_image, 'rb') as img_file:
        files = {'image': img_file}

        try:
            response = requests.post(
                f"{COLAB_API_URL}/api/verify",
                files=files,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                print("Response:")
                print(f"  Status: {result['status']}")
                print(f"  Message: {result['message']}")
                print(f"  Result: {result['result']}")
                print(f"  Confidence: {result['confidence']:.2%}")
                print(f"\nDetections:")
                for idx, detection in enumerate(result['detections'], 1):
                    print(f"  Detection #{idx}:")
                    print(f"    YOLO: {detection['yolo_label']} ({detection['yolo_confidence']:.2%})")
                    print(f"    CNN: {detection['cnn_label']} ({detection['cnn_confidence']:.2%})")
                    print(f"    Final: {detection['result']}")
                    print(f"    BBox: {detection['bbox']}")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)

        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    test_verify_endpoint()
