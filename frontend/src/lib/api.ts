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
