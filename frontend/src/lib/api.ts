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
    already_verified: boolean;
  } | null;
}

export async function verifyMedicine(image: File, lotId?: string): Promise<VerificationResult> {
  const formData = new FormData();
  formData.append("image", image);
  if (lotId) {
    formData.append("lot_id", lotId);
  }

  const res = await fetch(`${VISION_URL}/verify/`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Verification failed");
  }

  return res.json();
}

// Stats
export interface VerificationStats {
  stats: {
    genuine: number;
    suspicious: number;
    counterfeit: number;
  };
  recent: {
    id: string;
    result: string;
    confidence: number;
    created_at: string;
    hash: string;
    image_name: string;
    image: string | null;
  }[];
  total: number;
}

export async function getVerificationStats(): Promise<VerificationStats> {
  const res = await fetch(`${VISION_URL}/stats/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  return res.json();
}

export interface VerificationRecord {
  id: string;
  result: string;
  confidence: number;
  created_at: string;
  hash: string;
  image_name: string;
  image: string | null;
  status?: string;
}

export interface PendingVerification extends VerificationRecord {
  lot_id: string | null;
  lot_number: string | null;
}

export async function getVerificationsByType(result: string): Promise<VerificationRecord[]> {
  const res = await fetch(`${VISION_URL}/stats/?result=${result}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch verifications");
  }
  const data = await res.json();
  return data.records || [];
}

export interface Lot {
  id: string;
  product_name: string;
  product_code: string;
  lot_number: string;
  producer: string;
  manufacture_date: string;
  expiry_date: string;
  total_quantity: number;
  remaining_quantity: number;
  verification_status: "PENDING" | "APPROVED" | "NONE";
  pending_count: number;
  approved_count: number;
}

export async function getLots(): Promise<Lot[]> {
  const res = await fetch(`${API_URL}/lots/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch lots");
  }
  const data = await res.json();
  return data.lots || [];
}

export async function getUnverifiedLots(): Promise<Lot[]> {
  const res = await fetch(`${API_URL}/lots/?unverified=true`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch lots");
  }
  const data = await res.json();
  return data.lots || [];
}

export interface LotDetail extends Omit<Lot, "verification_status" | "pending_count" | "approved_count"> {
  blockchain_txid: string | null;
}

export async function getLotById(lotId: string): Promise<LotDetail> {
  const res = await fetch(`${API_URL}/lots/${lotId}/`, { credentials: "include" });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Lot not found");
    }
    throw new Error("Failed to fetch lot");
  }
  return res.json();
}

export async function getLotVerifications(lotId: string): Promise<VerificationRecord[]> {
  const res = await fetch(`${VISION_URL}/lots/${lotId}/verifications/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch verifications");
  }
  const data = await res.json();
  return data.verifications || [];
}

export async function getPendingVerifications(): Promise<PendingVerification[]> {
  const res = await fetch(`${VISION_URL}/verifications/pending/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch pending verifications");
  }
  const data = await res.json();
  return data.verifications || [];
}

export async function getUnlinkedVerifications(): Promise<VerificationRecord[]> {
  const res = await fetch(`${VISION_URL}/verifications/unlinked/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch unlinked verifications");
  }
  const data = await res.json();
  return data.verifications || [];
}

export async function linkVerification(verificationId: string, lotId: string): Promise<{ status: string; id: string; lot_id: string }> {
  const res = await fetch(`${VISION_URL}/verifications/${verificationId}/link/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ lot_id: lotId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to link verification");
  }
  return res.json();
}

export async function unlinkVerification(verificationId: string): Promise<{ status: string; id: string }> {
  const res = await fetch(`${VISION_URL}/verifications/${verificationId}/unlink/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to unlink verification");
  }
  return res.json();
}

export async function approveVerification(verificationId: string, action: "approve" | "reject"): Promise<{ status: string; id: string }> {
  const res = await fetch(`${VISION_URL}/verifications/${verificationId}/approve/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update verification");
  }
  return res.json();
}

export interface AuditLog {
  action: string;
  user: string;
  task: string;
  target_id: string;
  timestamp: string;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_URL}/audit/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch audit logs");
  }
  const data = await res.json();
  return data.logs || [];
}

export interface LotInput {
  product_name: string;
  product_code: string;
  lot_number: string;
  manufacture_date: string;
  expiry_date: string;
  total_quantity: number;
}

export async function createLot(lot: LotInput): Promise<{ id: string; lot_number: string }> {
  const res = await fetch(`${API_URL}/lots/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(lot),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create lot");
  }
  return res.json();
}

export interface DistributionEvent {
  id: string;
  lot_id: string;
  lot_number: string;
  actor: string;
  quantity: number;
  location: string;
  timestamp: string;
}

export async function getDistributionEvents(): Promise<DistributionEvent[]> {
  const res = await fetch(`${API_URL}/distribution/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch distribution events");
  }
  const data = await res.json();
  return data.events || [];
}

export interface DistributionInput {
  lot_id: string;
  quantity: number;
  location: string;
}

export async function createDistribution(input: DistributionInput): Promise<{ id: string; remaining_quantity: number }> {
  const res = await fetch(`${API_URL}/distribution/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create distribution");
  }
  return res.json();
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  company_name: string;
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users/`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }
  const data = await res.json();
  return data.users || [];
}

export interface UserInput {
  username: string;
  email: string;
  password: string;
  role: string;
  company_name?: string;
}

export async function createUser(input: UserInput): Promise<{ id: number; username: string }> {
  const res = await fetch(`${API_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create user");
  }
  return res.json();
}

export async function login(userId: number): Promise<User> {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Login failed");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/auth/logout/`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_URL}/auth/me/`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user;
}
