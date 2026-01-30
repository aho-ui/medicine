"use client";
import { Truck, TrendingUp, Package, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDistributionEvents, getLots, createDistribution, type DistributionEvent, type Lot } from "@/lib/api";

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function DistributionDetailModal({ event, onClose }: { event: DistributionEvent; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg border border-slate-700 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-cyan-400">Distribution Event</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Lot Number</div>
              <div className="text-slate-300 font-medium">{event.lot_number}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Quantity</div>
                <div className="text-cyan-400">{event.quantity} units</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Distributor</div>
                <div className="text-slate-300">{event.actor}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Destination</div>
              <div className="text-slate-300">{event.location}</div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Timestamp</div>
              <div className="text-slate-300">{new Date(event.timestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DistributionCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [selected, setSelected] = useState<DistributionEvent | null>(null);

  useEffect(() => {
    getDistributionEvents().then(setEvents).catch(() => {});
  }, [refreshKey]);

  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.timestamp).toDateString();
    return eventDate === new Date().toDateString();
  });

  const unitsToday = todayEvents.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="space-y-3 h-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-lg font-bold text-slate-200">{unitsToday.toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-500">Units Today</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-cyan-400" />
            <span className="text-lg font-bold text-slate-200">{todayEvents.length}</span>
          </div>
          <div className="text-xs text-slate-500">Shipments Today</div>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <div className="text-slate-500 mb-2">Recent Shipments</div>
        {events.slice(0, 4).map((event) => (
          <div
            key={event.id}
            onClick={() => setSelected(event)}
            className="p-2 bg-slate-800/30 rounded flex justify-between hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <span className="text-slate-300 truncate">→ {event.location}</span>
            <span className="text-slate-500">{event.quantity} {event.quantity === 1 ? "unit" : "units"}</span>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-slate-500 text-center py-2">No shipments</div>
        )}
      </div>

      {selected && (
        <DistributionDetailModal event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export function DistributionExpanded({ refreshKey = 0 }: { refreshKey?: number }) {
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selected, setSelected] = useState<DistributionEvent | null>(null);
  const [form, setForm] = useState({ lot_id: "", quantity: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getDistributionEvents().then(setEvents).catch(() => {});
    getLots().then(setLots).catch(() => {});
  }, [refreshKey]);

  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.timestamp).toDateString();
    return eventDate === new Date().toDateString();
  });

  const unitsToday = todayEvents.reduce((sum, e) => sum + e.quantity, 0);
  const destinations = new Set(todayEvents.map((e) => e.location)).size;

  const handleSubmit = async () => {
    if (!form.lot_id || !form.quantity || !form.location) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createDistribution({
        lot_id: form.lot_id,
        quantity: parseInt(form.quantity),
        location: form.location,
      });
      setSuccess("Distribution recorded successfully");
      setForm({ lot_id: "", quantity: "", location: "" });
      getDistributionEvents().then(setEvents).catch(() => {});
      getLots().then(setLots).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Distribution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg px-4 py-2 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">RECORD SHIPMENT</h4>
          <div className="space-y-3">
            <select
              value={form.lot_id}
              onChange={(e) => { setForm({ ...form, lot_id: e.target.value }); setError(null); setSuccess(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Select lot...</option>
              {lots.filter((l) => l.remaining_quantity > 0).map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.lot_number} - {lot.product_name} ({lot.remaining_quantity} left)
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => { setForm({ ...form, quantity: e.target.value }); setError(null); setSuccess(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Destination"
              value={form.location}
              onChange={(e) => { setForm({ ...form, location: e.target.value }); setError(null); setSuccess(null); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full border border-cyan-500 text-cyan-400 py-2 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              {loading ? "DISPATCHING..." : "DISPATCH"}
            </button>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">TODAY&apos;S STATS</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Shipments</span>
              <span className="text-cyan-400">{todayEvents.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Units moved</span>
              <span className="text-cyan-400">{unitsToday.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Destinations</span>
              <span className="text-cyan-400">{destinations}</span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-cyan-400 mb-3 text-sm tracking-wider">RECENT SHIPMENTS</h4>
        <div className="space-y-2 text-sm">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelected(event)}
              className="bg-slate-800/30 rounded-lg p-3 flex justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <span className="text-slate-300">{event.lot_number} → {event.location}</span>
              <span className="text-slate-500">{event.quantity} units • {timeAgo(event.timestamp)}</span>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-slate-500 text-center py-4">No shipments recorded</div>
          )}
        </div>
      </div>

      {selected && (
        <DistributionDetailModal event={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export const distributionConfig = {
  id: "distribution",
  title: "DISTRIBUTION",
  icon: Truck,
};
