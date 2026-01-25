"use client";
import { FileText } from "lucide-react";
import { logTypeStyles, type LogType } from "@/lib/styles";

// Placeholder data - replace with real data later
const stats = {
  totalLogs: 156,
  todayLogs: 23,
};

const recentLogs: { type: LogType; message: string; time: string }[] = [
  { type: "VRF", message: "john_admin verified L-001", time: "2m ago" },
  { type: "DST", message: "mike_dist → Central", time: "15m ago" },
  { type: "REG", message: "sarah_mfg new lot L-005", time: "1h ago" },
  { type: "USR", message: "Created rx_pharmacy", time: "3h ago" },
];

const actionFilters = ["All Actions", "Verification", "Distribution", "User Management"];

// Card view - shows on dashboard
export function AuditCard() {
  return (
    <div className="space-y-3 h-full">
      {/* Stats */}
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-bold text-cyan-400">{stats.totalLogs}</div>
          <div className="text-xs text-slate-500">Total Logs</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-300">{stats.todayLogs}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="space-y-1 text-xs">
        {recentLogs.map((log, i) => (
          <div key={i} className="p-2 bg-slate-800/30 rounded flex items-center gap-2">
            <span className={logTypeStyles[log.type].text}>[{log.type}]</span>
            <span className="text-slate-400 truncate">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expanded view - shows in modal
export function AuditExpanded() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <select className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none">
            {actionFilters.map((filter) => (
              <option key={filter}>{filter}</option>
            ))}
          </select>
          <input
            type="date"
            className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <button className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors">
          [EXPORT]
        </button>
      </div>
      <div className="space-y-2 text-sm">
        {([
          { type: "VERIFY", message: "john_admin verified LOT-2024-001", time: "2m ago" },
          { type: "DISTRIBUTE", message: "mike_dist shipped 50 units → Central Pharmacy", time: "15m ago" },
          { type: "REGISTER", message: "sarah_mfg registered LOT-2024-005", time: "1h ago" },
          { type: "USER", message: "john_admin created user rx_pharmacy", time: "3h ago" },
        ] as { type: LogType; message: string; time: string }[]).map((log, i) => (
          <div key={i} className="bg-slate-800/30 rounded-lg p-3 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
            <div>
              <span className={logTypeStyles[log.type].text}>[{log.type}]</span>
              <span className="text-slate-600 mx-2">•</span>
              <span className="text-slate-300">{log.message}</span>
            </div>
            <span className="text-slate-500">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export config for page.tsx
export const auditConfig = {
  id: "audit",
  title: "AUDIT",
  icon: FileText,
};
