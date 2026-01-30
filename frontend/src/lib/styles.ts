// Centralized style mappings - derive presentation from data
// This ensures Tailwind sees actual class names (no purging issues)

// User roles
export const roleStyles = {
  ADMIN: { text: "text-red-400", bg: "bg-red-400" },
  MANUFACTURER: { text: "text-blue-400", bg: "bg-blue-400" },
  DISTRIBUTOR: { text: "text-purple-400", bg: "bg-purple-400" },
  PHARMACY: { text: "text-emerald-400", bg: "bg-emerald-400" },
} as const;

export type Role = keyof typeof roleStyles;

// Verification status
export const verificationStyles = {
  genuine: { text: "text-emerald-400", bg: "bg-emerald-400" },
  suspicious: { text: "text-amber-400", bg: "bg-amber-400" },
  counterfeit: { text: "text-red-400", bg: "bg-red-400" },
} as const;

export type VerificationStatus = keyof typeof verificationStyles;

// Audit log types
export const logTypeStyles = {
  CREATE: { text: "text-cyan-400", label: "CREATE" },
  VERIFY: { text: "text-emerald-400", label: "VERIFY" },
  DISTRIBUTE: { text: "text-purple-400", label: "DISTRIBUTE" },
  UPDATE: { text: "text-amber-400", label: "UPDATE" },
  DELETE: { text: "text-red-400", label: "DELETE" },
  LOGIN: { text: "text-blue-400", label: "LOGIN" },
  LOGOUT: { text: "text-slate-400", label: "LOGOUT" },
  REGISTER: { text: "text-amber-400", label: "REGISTER" },
} as const;

export type LogType = keyof typeof logTypeStyles;

// Lot/inventory status
export const lotStyles = {
  ok: { text: "text-cyan-400" },
  warning: { text: "text-amber-400" },
  critical: { text: "text-red-400" },
} as const;

export type LotStatus = keyof typeof lotStyles;

// System/blockchain status
export const statusStyles = {
  online: { text: "text-emerald-400", label: "Online" },
  offline: { text: "text-red-400", label: "Offline" },
  checking: { text: "text-amber-400", label: "Checking..." },
  connected: { text: "text-emerald-400", label: "Connected" },
  disconnected: { text: "text-red-400", label: "Disconnected" },
} as const;

export type StatusType = keyof typeof statusStyles;
