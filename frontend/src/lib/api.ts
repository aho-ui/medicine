export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export const VISION_URL = process.env.NEXT_PUBLIC_VISION_URL || "http://localhost:8000/vision";

// Health checks
export async function checkSystemHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health/`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkBlockchainHealth(): Promise<{ connected: boolean; blockNumber?: number }> {
  try {
    const res = await fetch(`${API_URL}/health/blockchain/`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      return { connected: true, blockNumber: data.block_number };
    }
    return { connected: false };
  } catch {
    return { connected: false };
  }
}

// Verification
export interface Detection {
  bbox: [number, number, number, number];
  yolo_label: string;
  yolo_confidence: number;
  cnn_label: string;
  cnn_confidence: number;
  result: string; // "GENUINE" | "SUSPICIOUS" | "COUNTERFEIT"
}

export interface VerificationResult {
  detections: Detection[];
  blockchain: {
    tx_hash: string;
    block: number;
    verification_id: number;
  } | null;
}

export async function verifyMedicine(image: File): Promise<VerificationResult> {
  const formData = new FormData();
  formData.append("image", image);

  const res = await fetch(`${VISION_URL}/verify/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Verification failed");
  }

  return res.json();
}
