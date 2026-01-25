"use client";
import { Truck, TrendingUp, Package } from "lucide-react";

// Placeholder data - replace with real data later
const stats = {
  unitsToday: 1240,
  shipments: 12,
  destinations: 8,
};

const recentShipments = [
  { lot: "LOT-2024-001", destination: "Central Pharmacy", units: 50, time: "2h ago" },
  { lot: "LOT-2024-002", destination: "City Hospital", units: 120, time: "4h ago" },
  { lot: "LOT-2024-003", destination: "MedStore #12", units: 30, time: "6h ago" },
];

const lotOptions = [
  { id: "LOT-2024-001", name: "Amoxicillin" },
  { id: "LOT-2024-002", name: "Ibuprofen" },
];

// Card view - shows on dashboard
export function DistributionCard() {
  return (
    <div className="space-y-3 h-full">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-lg font-bold text-slate-200">{stats.unitsToday.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500">Units Today</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-cyan-400" />
            <span className="text-lg font-bold text-slate-200">{stats.shipments}</span>
          </div>
          <div className="text-xs text-slate-500">Shipments</div>
        </div>
      </div>

      {/* Recent shipments */}
      <div className="space-y-1 text-xs">
        <div className="text-slate-500 mb-2">Recent Shipments</div>
        {recentShipments.map((shipment, i) => (
          <div key={i} className="p-2 bg-slate-800/30 rounded flex justify-between">
            <span className="text-slate-300">→ {shipment.destination}</span>
            <span className="text-slate-500">{shipment.units}u</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Expanded view - shows in modal
export function DistributionExpanded() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">RECORD SHIPMENT</h4>
          <div className="space-y-3">
            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none">
              <option>Select lot...</option>
              {lotOptions.map((lot) => (
                <option key={lot.id}>{lot.id} - {lot.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Destination"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button className="w-full border border-cyan-500 text-cyan-400 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors">
              DISPATCH
            </button>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">TODAY&apos;S STATS</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Shipments</span>
              <span className="text-cyan-400">{stats.shipments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Units moved</span>
              <span className="text-cyan-400">{stats.unitsToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destinations</span>
              <span className="text-cyan-400">{stats.destinations}</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">RECENT SHIPMENTS</h4>
        <div className="space-y-2 text-sm">
          {recentShipments.map((shipment, i) => (
            <div key={i} className="bg-slate-800/30 rounded-lg p-3 flex justify-between hover:bg-slate-800/50 transition-colors">
              <span className="text-slate-300">{shipment.lot} → {shipment.destination}</span>
              <span className="text-slate-500">{shipment.units} units • {shipment.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export config for page.tsx
export const distributionConfig = {
  id: "distribution",
  title: "DISTRIBUTION",
  icon: Truck,
};
