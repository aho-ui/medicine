"use client";
import { useState } from "react";

interface VerificationResult {
  result: "GENUINE" | "SUSPICIOUS" | "COUNTERFEIT";
  confidence: number;
  manufacturer: string;
  product_name: string;
  expiry_date: string;
  blockchain_txid: string;
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

      const res = await fetch("http://127.0.0.1:8000/vision/verify/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Verification failed");
      }

      const data = await res.json();
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
          <h2 className="text-xl font-bold mb-2">Verification Result</h2>

          <div className={`text-2xl font-bold mb-4 ${
            result.result === "GENUINE" ? "text-green-600" :
            result.result === "SUSPICIOUS" ? "text-yellow-600" :
            "text-red-600"
          }`}>
            {result.result}
          </div>

          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Confidence</td>
                <td>{(result.confidence * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Product</td>
                <td>{result.product_name}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Manufacturer</td>
                <td>{result.manufacturer}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Expiry Date</td>
                <td>{result.expiry_date}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Blockchain TX</td>
                <td className="text-xs break-all">{result.blockchain_txid}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
