"use client";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { verificationStyles, type VerificationStatus } from "@/lib/styles";

// Placeholder data - replace with real data later
const stats = {
  genuine: 18,
  suspicious: 4,
  counterfeit: 2,
};

const chartData = [40, 65, 45, 80, 55, 90, 70];

const recentVerifications: { name: string; status: VerificationStatus }[] = [
  { name: "Amoxicillin 500mg", status: "genuine" },
  { name: "Ibuprofen 200mg", status: "genuine" },
  { name: "Unknown Package", status: "counterfeit" },
];

// Card view - shows on dashboard
export function VerifyCard() {
  return (
    <div className="space-y-3 h-full">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-emerald-400">{stats.genuine}</div>
          <div className="text-xs text-slate-500">Genuine</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-amber-400">{stats.suspicious}</div>
          <div className="text-xs text-slate-500">Suspicious</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-red-400">{stats.counterfeit}</div>
          <div className="text-xs text-slate-500">Counterfeit</div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="bg-slate-800/30 rounded-lg p-3">
        <div className="text-xs text-slate-500 mb-2">Last 7 days</div>
        <div className="flex items-end gap-1 h-12">
          {chartData.map((h, i) => (
            <div key={i} className="flex-1 bg-cyan-500/30 rounded-t" style={{ height: `${h}%` }}>
              <div className="w-full bg-cyan-500 rounded-t" style={{ height: "40%" }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div className="space-y-1 text-xs">
        {recentVerifications.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
            <span className="text-slate-400">{item.name}</span>
            {item.status === "genuine" ? (
              <CheckCircle2 size={14} className={verificationStyles[item.status].text} />
            ) : (
              <XCircle size={14} className={verificationStyles[item.status].text} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Expanded view - shows in modal
export function VerifyExpanded() {
  return (
    <div className="space-y-4">
      <p className="text-slate-400">Upload an image to verify medicine authenticity.</p>
      <div className="border border-dashed border-cyan-500/50 rounded-lg p-12 text-center hover:border-cyan-400 hover:bg-cyan-500/5 transition-colors cursor-pointer">
        <ShieldCheck size={48} className="mx-auto mb-2 text-cyan-500" />
        <p className="text-slate-500">Drop image here or click to upload</p>
      </div>
      <div className="bg-slate-800/50 rounded-lg p-4">
        <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">RECENT VERIFICATIONS</h4>
        <div className="space-y-2 text-sm">
          {recentVerifications.map((item, i) => (
            <div key={i} className="flex justify-between">
              <span className="text-slate-400">{item.name}</span>
              <span className={verificationStyles[item.status].text}>
                [{item.status.toUpperCase()}]
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export config for page.tsx
export const verifyConfig = {
  id: "verify",
  title: "VERIFY",
  icon: ShieldCheck,
};
