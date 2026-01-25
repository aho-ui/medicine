"use client";
import { FlaskConical } from "lucide-react";

// Placeholder data - replace with real data later
const stats = {
  activeLots: 12,
  expiringSoon: 3,
};

const lotsData = [
  { id: "L-001", product: "Amoxicillin", qty: 450, qtyTotal: 500, expiry: "2025-12", warning: false },
  { id: "L-002", product: "Ibuprofen", qty: 280, qtyTotal: 300, expiry: "2026-03", warning: false },
  { id: "L-003", product: "Paracetamol", qty: 100, qtyTotal: 100, expiry: "2026-06", warning: false },
  { id: "L-004", product: "Aspirin", qty: 75, qtyTotal: 200, expiry: "2025-09", warning: true },
  { id: "L-005", product: "Metformin", qty: 320, qtyTotal: 400, expiry: "2027-01", warning: false },
];

// Card view - shows on dashboard
export function LotsCard() {
  return (
    <div className="space-y-3 h-full">
      {/* Stats row */}
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-bold text-cyan-400">{stats.activeLots}</div>
          <div className="text-xs text-slate-500">Active Lots</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-400">{stats.expiringSoon}</div>
          <div className="text-xs text-slate-500">Expiring Soon</div>
        </div>
      </div>

      {/* Mini table */}
      <div className="space-y-1 text-xs">
        <div className="grid grid-cols-3 gap-2 text-slate-500 pb-1 border-b border-slate-800">
          <span>LOT</span>
          <span>PRODUCT</span>
          <span className="text-right">QTY</span>
        </div>
        {lotsData.slice(0, 4).map((lot) => (
          <div key={lot.id} className="grid grid-cols-3 gap-2 p-1 hover:bg-slate-800/30 rounded">
            <span className="text-slate-400">{lot.id}</span>
            <span className="text-slate-300">{lot.product}</span>
            <span className={`text-right ${lot.warning ? "text-amber-400" : "text-cyan-400"}`}>
              {lot.qty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expanded view - shows in modal
export function LotsExpanded() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search lots..."
          className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <button className="border border-cyan-500 text-cyan-400 px-4 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors">
          SEARCH
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-cyan-400 border-b border-slate-700">
              <th className="pb-3">LOT ID</th>
              <th className="pb-3">PRODUCT</th>
              <th className="pb-3">QTY</th>
              <th className="pb-3">EXPIRY</th>
              <th className="pb-3">QR</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {lotsData.map((lot) => (
              <tr key={lot.id} className="border-b border-slate-800 hover:bg-cyan-500/5">
                <td className="py-3">LOT-2024-{lot.id.split("-")[1]}</td>
                <td>{lot.product}</td>
                <td>{lot.qty}/{lot.qtyTotal}</td>
                <td>{lot.expiry}</td>
                <td className="text-cyan-400 cursor-pointer hover:underline">[view]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center gap-4 text-sm">
        <button className="text-slate-500 hover:text-cyan-400 transition-colors">[← prev]</button>
        <span className="text-slate-500">page 1/3</span>
        <button className="text-slate-500 hover:text-cyan-400 transition-colors">[next →]</button>
      </div>
    </div>
  );
}

// Export config for page.tsx
export const lotsConfig = {
  id: "lots",
  title: "LOTS",
  icon: FlaskConical,
};
