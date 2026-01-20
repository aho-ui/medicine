import os
import cv2
import numpy as np
import tensorflow as tf
from ultralytics import YOLO
from flask import Flask, request, jsonify

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
YOLO_MODEL_PATH = f"{MODEL_DIR}/medicine_yolo.pt"
CNN_MODEL_PATH = f"{MODEL_DIR}/medicine_cnn.h5"
IMG_SIZE = 160

app = Flask(__name__)

yolo_model = None
cnn_model = None


def load_models():
    global yolo_model, cnn_model
    if os.path.exists(YOLO_MODEL_PATH):
        yolo_model = YOLO(YOLO_MODEL_PATH)
        print("YOLO model loaded")
    else:
        print(f"YOLO model not found at {YOLO_MODEL_PATH}")

    if os.path.exists(CNN_MODEL_PATH):
        cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)
        print("CNN model loaded")
    else:
        print(f"CNN model not found at {CNN_MODEL_PATH}")


def verify_image(image_array):
    if yolo_model is None or cnn_model is None:
        return {
            "status": "error",
            "message": "Models not loaded",
            "result": None,
            "confidence": 0.0,
            "detections": []
        }

    results = yolo_model.predict(image_array, verbose=False)

    if len(results[0].boxes) == 0:
        return {
            "status": "success",
            "message": "No packages detected",
            "result": None,
            "confidence": 0.0,
            "detections": []
        }

    detections = []

    for box in results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        yolo_class = int(box.cls[0])
        yolo_conf = float(box.conf[0])
        yolo_label = "authentic" if yolo_class == 0 else "counterfeit"

        crop = image_array[y1:y2, x1:x2]
        crop_resized = cv2.resize(crop, (IMG_SIZE, IMG_SIZE))
        crop_array = crop_resized.astype("float32") / 255.0
        crop_array = np.expand_dims(crop_array, axis=0)

        cnn_pred = cnn_model.predict(crop_array, verbose=0)
        cnn_class = np.argmax(cnn_pred[0])
        cnn_conf = float(np.max(cnn_pred[0]))
        cnn_label = "authentic" if cnn_class == 0 else "counterfeit"

        if yolo_label == cnn_label and cnn_conf > 0.8:
            final_result = "GENUINE" if yolo_label == "authentic" else "COUNTERFEIT"
        else:
            final_result = "SUSPICIOUS"

        detections.append({
            "bbox": [x1, y1, x2, y2],
            "yolo_label": yolo_label,
            "yolo_confidence": yolo_conf,
            "cnn_label": cnn_label,
            "cnn_confidence": cnn_conf,
            "result": final_result
        })

    return {
        "status": "success",
        "message": "Verification complete",
        "result": detections[0]["result"] if len(detections) == 1 else "MULTIPLE_PACKAGES",
        "confidence": detections[0]["cnn_confidence"] if len(detections) == 1 else 0.0,
        "detections": detections
    }


@app.route("/", methods=["GET"])
def hello():
    return jsonify({
        "status": "success",
        "message": "Medicine AI Vision Server is running",
        "service": "vision-inspection"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "vision-inspection"
    })


@app.route("/api/verify", methods=["POST"])
def verify_package():
    if "image" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No image provided"
        }), 400

    image_file = request.files["image"]
    image_bytes = image_file.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image_array is None:
        return jsonify({
            "status": "error",
            "message": "Invalid image format"
        }), 400

    result = verify_image(image_array)
    return jsonify(result)


if __name__ == "__main__":
    port = 5000

    load_models()

    print(f"Server running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port)
