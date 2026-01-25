"use client";
import { useState } from "react";
import { VISION_URL } from "@/lib/api";

interface Detection {
  bbox: number[];
  yolo_label: string;
  yolo_confidence: number;
  cnn_label: string;
  cnn_confidence: number;
  result: "GENUINE" | "SUSPICIOUS" | "COUNTERFEIT";
}

interface VerificationResult {
  result: string;
  confidence: number;
  detections: Detection[];
  blockchain: {
    tx_hash: string;
    block: number;
    verification_id: number;
    already_verified?: boolean;
  };
}

export default function VerifyPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!image) {
      setError("Please select an image");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch(`${VISION_URL}/verify/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Verify Medicine</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Upload Medicine Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full"
          />
        </div>

        {preview && (
          <div>
            <img src={preview} alt="Preview" className="max-w-xs border" />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !image}
          className="bg-blue-500 text-white px-4 py-2 disabled:bg-gray-400"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-900 text-red-200 border border-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 border">
          <h2 className="text-xl font-bold mb-4">Verification Result</h2>

          {result.blockchain.already_verified && (
            <div className="mb-4 p-3 bg-blue-900 text-blue-200 border border-blue-600">
              <div className="font-bold mb-1">Previously Verified</div>
              <div className="text-sm">Verification ID: {result.blockchain.verification_id}</div>
            </div>
          )}

          <div className="mb-4">
            <div className="font-medium">Blockchain TX</div>
            <div className="text-xs break-all">{result.blockchain.tx_hash}</div>
            {result.blockchain.block > 0 && (
              <div className="text-sm text-gray-400">Block: {result.blockchain.block}</div>
            )}
          </div>

          <h3 className="text-lg font-bold mb-2">Detections ({result.detections.length})</h3>

          <div className="space-y-4">
            {result.detections.map((detection, idx) => (
              <div key={idx} className="p-3 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Package {idx + 1}</span>
                  <span className={`text-xl font-bold ${
                    detection.result === "GENUINE" ? "text-green-600" :
                    detection.result === "SUSPICIOUS" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {detection.result}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">YOLO:</span> {detection.yolo_label} ({(detection.yolo_confidence * 100).toFixed(1)}%)
                  </div>
                  <div>
                    <span className="font-medium">CNN:</span> {detection.cnn_label} ({(detection.cnn_confidence * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
