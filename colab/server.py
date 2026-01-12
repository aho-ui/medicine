# !pip install flask pyngrok

from flask import Flask, request, jsonify
from pyngrok import ngrok
import os

app = Flask(__name__)


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
    return jsonify({
        "status": "success",
        "message": "Verification endpoint ready",
        "result": "GENUINE",
        "confidence": 0.95,
        "bbox": None
    })


if __name__ == "__main__":
    port = 5000

    public_url = ngrok.connect(port)
    print(f"Ngrok Tunnel URL: {public_url}")
    print(f"Add this URL to your Django .env file as COLAB_API_URL")

    app.run(port=port)
