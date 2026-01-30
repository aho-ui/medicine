"use client";
import { PlusCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createLot, getLots, type Lot, API_URL } from "@/lib/api";

function LotDetailModal({ lot, onClose }: { lot: Lot; onClose: () => void }) {
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
          <h3 className="text-lg font-semibold text-cyan-400">{lot.product_name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Lot Number</div>
              <div className="text-slate-300 font-medium">{lot.lot_number}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Product Code</div>
                <div className="text-slate-300">{lot.product_code}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Quantity</div>
                <div className="text-cyan-400">{lot.remaining_quantity}/{lot.total_quantity}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Manufacture</div>
                <div className="text-slate-300">{lot.manufacture_date}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Expiry</div>
                <div className="text-slate-300">{lot.expiry_date}</div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Producer</div>
              <div className="text-slate-300">{lot.producer}</div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <img
              src={`${API_URL}/lots/${lot.id}/qr/`}
              alt="QR Code"
              className="w-32 h-32 rounded border border-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [selected, setSelected] = useState<Lot | null>(null);

  useEffect(() => {
    getLots().then(setLots).catch(() => {});
  }, [refreshKey]);

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-400">Recent registrations</div>
        <div className="text-xs text-cyan-400">{lots.length} lots</div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {lots.slice(0, 10).map((lot) => (
          <div
            key={lot.id}
            onClick={() => setSelected(lot)}
            className="p-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="text-sm text-slate-300 truncate">{lot.product_name}</div>
              <div className="text-xs text-cyan-400 ml-2">{lot.total_quantity}</div>
            </div>
            <div className="text-xs text-slate-500">{lot.lot_number}</div>
          </div>
        ))}
        {lots.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-4">No lots registered</div>
        )}
      </div>

      {selected && (
        <LotDetailModal lot={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export function RegisterExpanded() {
  const [form, setForm] = useState({
    product_name: "",
    product_code: "",
    lot_number: "",
    total_quantity: "",
    manufacture_date: "",
    expiry_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!form.product_name || !form.product_code || !form.lot_number ||
        !form.total_quantity || !form.manufacture_date || !form.expiry_date) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createLot({
        ...form,
        total_quantity: parseInt(form.total_quantity),
      });
      setSuccess(`Lot ${result.lot_number} registered successfully`);
      setForm({
        product_name: "",
        product_code: "",
        lot_number: "",
        total_quantity: "",
        manufacture_date: "",
        expiry_date: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">Register a new medicine lot in the supply chain.</p>

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
        <div>
          <label className="block text-xs text-cyan-400 mb-1">PRODUCT NAME</label>
          <input
            type="text"
            name="product_name"
            value={form.product_name}
            onChange={handleChange}
            placeholder="Amoxicillin 500mg"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">PRODUCT CODE</label>
          <input
            type="text"
            name="product_code"
            value={form.product_code}
            onChange={handleChange}
            placeholder="AMX-500"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">LOT NUMBER</label>
          <input
            type="text"
            name="lot_number"
            value={form.lot_number}
            onChange={handleChange}
            placeholder="LOT-2024-006"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">QUANTITY</label>
          <input
            type="number"
            name="total_quantity"
            value={form.total_quantity}
            onChange={handleChange}
            placeholder="500"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">MANUFACTURE DATE</label>
          <input
            type="date"
            name="manufacture_date"
            value={form.manufacture_date}
            onChange={handleChange}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-cyan-400 mb-1">EXPIRY DATE</label>
          <input
            type="date"
            name="expiry_date"
            value={form.expiry_date}
            onChange={handleChange}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full border border-cyan-500 text-cyan-400 py-3 rounded-lg hover:bg-cyan-500 hover:text-slate-900 transition-colors tracking-wider disabled:opacity-50"
      >
        {loading ? "REGISTERING..." : "REGISTER LOT"}
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
