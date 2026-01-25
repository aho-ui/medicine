"use client";
import { PlusCircle } from "lucide-react";

// Card view - shows on dashboard
export function RegisterCard() {
  return (
    <div className="space-y-3 h-full">
      <div className="text-sm text-slate-400">Quick register a new medicine lot</div>

      {/* Quick form preview */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Product name..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Lot number..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Qty"
            className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="date"
            className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="text-xs text-slate-500">Expand for full form →</div>
    </div>
  );
}

// Expanded view - shows in modal
export function RegisterExpanded() {
  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">Register a new medicine lot in the supply chain.</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-cyan-400 mb-1">PRODUCT NAME</label>
          <input
            type="text"
            placeholder="Amoxicillin 500mg"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">PRODUCT CODE</label>
          <input
            type="text"
            placeholder="AMX-500"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">LOT NUMBER</label>
          <input
            type="text"
            placeholder="LOT-2024-006"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">QUANTITY</label>
          <input
            type="number"
            placeholder="500"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">MANUFACTURE DATE</label>
          <input
            type="date"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">EXPIRY DATE</label>
          <input
            type="date"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>
      <button className="w-full border border-cyan-500 text-cyan-400 py-3 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors tracking-wider">
        REGISTER LOT
      </button>
    </div>
  );
}

// Export config for page.tsx
export const registerConfig = {
  id: "register",
  title: "REGISTER",
  icon: PlusCircle,
};
