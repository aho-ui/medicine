"use client";
import { FlaskConical, X, Download, CheckCircle2, XCircle, Loader2, Clock, Check, Ban, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getLots, getLotVerifications, getPendingVerifications, approveVerification, getUnlinkedVerifications, linkVerification, type Lot, type VerificationRecord, type PendingVerification, API_URL } from "@/lib/api";
import { Link2 } from "lucide-react";

function QRModal({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  const qrUrl = `${API_URL}/lots/${lot.id}/qr/`;

  const handleDownload = async () => {
    const response = await fetch(qrUrl, { credentials: "include" });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lot.lot_number}_qr.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        className="bg-slate-900 rounded-lg border border-slate-700 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-cyan-400 font-medium">{lot.lot_number}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded border border-slate-700 mb-3" />
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  );
}

function ImageModal({ imageUrl, imageName, onClose }: { imageUrl: string; imageName: string; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div className="relative max-w-2xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-full max-h-[80vh] rounded-lg border border-slate-700"
        />
        <div className="text-center text-slate-400 text-sm mt-2">{imageName}</div>
      </div>
    </div>
  );
}

function LotDetailModal({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [unlinked, setUnlinked] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState<string | null>(null);
  const [unlinkedOpen, setUnlinkedOpen] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
    : "http://localhost:8000";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [approved, pending, unlinkedList] = await Promise.all([
        getLotVerifications(lot.id),
        getPendingVerifications(),
        getUnlinkedVerifications(),
      ]);
      setVerifications(approved);
      setPendingVerifications(pending.filter((p) => p.lot_id === lot.id));
      setUnlinked(unlinkedList);
    } catch {
      setVerifications([]);
      setPendingVerifications([]);
      setUnlinked([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (verificationId: string) => {
    setLinkLoading(verificationId);
    try {
      await linkVerification(verificationId, lot.id);
      await fetchData();
    } catch (err) {
      console.error("Failed to link verification:", err);
    } finally {
      setLinkLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lot.id]);

  const handleApprove = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      await approveVerification(id, action);
      await fetchData();
    } catch (err) {
      console.error("Failed to update verification:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pendingVerifications.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingVerifications.map((v) => v.id)));
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) => approveVerification(id, action))
      );
      setSelected(new Set());
      await fetchData();
    } catch (err) {
      console.error("Failed to bulk update verifications:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full max-h-[90vh] overflow-y-auto"
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

          {/* Pending Verifications */}
          {pendingVerifications.length > 0 && (
            <div className="border-t border-slate-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-400" />
                  <div className="text-amber-400 text-xs uppercase tracking-wide">Pending Approval</div>
                </div>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {selected.size === pendingVerifications.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Bulk action buttons */}
              {selected.size > 0 && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-slate-800/80 rounded-lg">
                  <span className="text-xs text-slate-400">{selected.size} selected</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleBulkAction("approve")}
                    disabled={bulkLoading}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs transition-colors disabled:opacity-50"
                  >
                    {bulkLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction("reject")}
                    disabled={bulkLoading}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors disabled:opacity-50"
                  >
                    <Ban size={12} />
                    Reject
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {pendingVerifications.map((v) => {
                  const status = v.result.toLowerCase();
                  const borderColor = status === "genuine" ? "border-emerald-500/50" :
                    status === "suspicious" ? "border-amber-500/50" : "border-red-500/50";
                  const textColor = status === "genuine" ? "text-emerald-400" :
                    status === "suspicious" ? "text-amber-400" : "text-red-400";
                  const isSelected = selected.has(v.id);

                  return (
                    <div
                      key={v.id}
                      className={`rounded-lg border ${isSelected ? "border-cyan-500 bg-cyan-500/10" : `${borderColor} bg-slate-800/50`} p-2 transition-colors`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(v.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-cyan-500 border-cyan-500 text-white"
                              : "border-slate-600 hover:border-cyan-500"
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                        </button>

                        {v.image && (
                          <img
                            src={`${baseUrl}${v.image}`}
                            alt={v.image_name}
                            className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                            onClick={() => setSelectedImage({ url: `${baseUrl}${v.image}`, name: v.image_name })}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${textColor}`}>{v.result}</div>
                          <div className="text-xs text-slate-500">{(v.confidence * 100).toFixed(1)}% confidence</div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprove(v.id, "approve")}
                            disabled={actionLoading === v.id || bulkLoading}
                            className="p-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === v.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={() => handleApprove(v.id, "reject")}
                            disabled={actionLoading === v.id || bulkLoading}
                            className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unlinked Verifications */}
          {unlinked.length > 0 && (
            <div className="border-t border-slate-700 pt-3">
              <button
                onClick={() => setUnlinkedOpen(!unlinkedOpen)}
                className="flex items-center gap-2 w-full text-left mb-2 group"
              >
                <Link2 size={14} className="text-cyan-400" />
                <div className="text-cyan-400 text-xs uppercase tracking-wide">Unlinked Verifications</div>
                <span className="text-xs text-slate-500">({unlinked.length})</span>
                <ChevronDown size={14} className={`text-cyan-400 ml-auto transition-transform ${unlinkedOpen ? "rotate-180" : ""}`} />
              </button>
              {unlinkedOpen && (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {unlinked.map((v) => {
                    const status = v.result.toLowerCase();
                    const textColor = status === "genuine" ? "text-emerald-400" :
                      status === "suspicious" ? "text-amber-400" : "text-red-400";

                    return (
                      <div key={v.id} className="flex items-center gap-2 rounded bg-slate-800/50 px-2 py-1.5">
                        <div className={`text-xs font-medium ${textColor} w-20 shrink-0`}>{v.result}</div>
                        <div className="text-xs text-slate-400 truncate flex-1">{v.image_name || "Unnamed"}</div>
                        <div className="text-xs text-slate-500 shrink-0">{new Date(v.created_at).toLocaleDateString()}</div>
                        <button
                          onClick={() => handleLink(v.id)}
                          disabled={linkLoading === v.id}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs transition-colors disabled:opacity-50 shrink-0"
                        >
                          {linkLoading === v.id ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                          Link
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Verification Images */}
          <div className="border-t border-slate-700 pt-3">
            <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Approved Verifications</div>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="text-cyan-500 animate-spin" />
              </div>
            ) : verifications.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-3">No approved verifications</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {verifications.map((v) => {
                  const status = v.result.toLowerCase();
                  const borderColor = status === "genuine" ? "border-emerald-500" :
                    status === "suspicious" ? "border-amber-500" : "border-red-500";
                  const Icon = status === "genuine" ? CheckCircle2 : XCircle;
                  const iconColor = status === "genuine" ? "text-emerald-400" :
                    status === "suspicious" ? "text-amber-400" : "text-red-400";

                  return (
                    <div
                      key={v.id}
                      className={`relative rounded-lg border-2 ${borderColor} overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => v.image && setSelectedImage({ url: `${baseUrl}${v.image}`, name: v.image_name })}
                    >
                      {v.image && (
                        <img
                          src={`${baseUrl}${v.image}`}
                          alt={v.image_name}
                          className="w-full h-20 object-cover"
                        />
                      )}
                      <div className="absolute bottom-1 right-1">
                        <Icon size={16} className={iconColor} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
}

export function LotsCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [selected, setSelected] = useState<Lot | null>(null);

  useEffect(() => {
    getLots().then(setLots).catch(() => {});
  }, [refreshKey]);

  const expiringSoon = lots.filter((lot) => {
    const expiry = new Date(lot.expiry_date);
    const now = new Date();
    const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 90 && diff > 0;
  }).length;

  return (
    <div className="space-y-3 h-full">
      <div className="flex gap-4">
        <div>
          <div className="text-2xl font-bold text-cyan-400">{lots.length}</div>
          <div className="text-xs text-slate-500">Active Lots</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-400">{expiringSoon}</div>
          <div className="text-xs text-slate-500">Expiring Soon</div>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        <div className="grid grid-cols-3 gap-2 text-slate-500 pb-1 border-b border-slate-800">
          <span>LOT</span>
          <span>PRODUCT</span>
          <span className="text-right">QTY</span>
        </div>
        {lots.slice(0, 4).map((lot) => {
          const lowStock = lot.remaining_quantity < lot.total_quantity * 0.25;
          return (
            <div
              key={lot.id}
              onClick={() => setSelected(lot)}
              className="grid grid-cols-3 gap-2 p-1 hover:bg-slate-800/30 rounded cursor-pointer"
            >
              <span className="text-slate-400">{lot.lot_number}</span>
              <span className="text-slate-300 truncate">{lot.product_name}</span>
              <span className={`text-right ${lowStock ? "text-amber-400" : "text-cyan-400"}`}>
                {lot.remaining_quantity}
              </span>
            </div>
          );
        })}
        {lots.length === 0 && <div className="text-slate-500 text-center py-2">No lots</div>}
      </div>

      {selected && (
        <LotDetailModal lot={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export function LotsExpanded({ refreshKey = 0 }: { refreshKey?: number }) {
  const [lots, setLots] = useState<Lot[]>([]);
  const [search, setSearch] = useState("");
  const [selectedQR, setSelectedQR] = useState<Lot | null>(null);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  useEffect(() => {
    getLots().then(setLots).catch(() => {});
  }, [refreshKey]);

  const filtered = search
    ? lots.filter((lot) =>
        lot.product_name.toLowerCase().includes(search.toLowerCase()) ||
        lot.lot_number.toLowerCase().includes(search.toLowerCase())
      )
    : lots;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search lots..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-cyan-400 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-cyan-400 border-b border-slate-700">
              <th className="pb-3">LOT</th>
              <th className="pb-3">PRODUCT</th>
              <th className="pb-3">PRODUCER</th>
              <th className="pb-3">QTY</th>
              <th className="pb-3">EXPIRY</th>
              <th className="pb-3">STATUS</th>
              <th className="pb-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {filtered.map((lot) => {
              const statusColor = lot.verification_status === "APPROVED"
                ? "text-emerald-400"
                : lot.verification_status === "PENDING"
                ? "text-amber-400"
                : "text-slate-500";
              const statusText = lot.verification_status === "APPROVED"
                ? `Approved (${lot.approved_count})`
                : lot.verification_status === "PENDING"
                ? `Pending (${lot.pending_count})`
                : "None";

              return (
                <tr key={lot.id} className="border-b border-slate-800 hover:bg-cyan-500/5">
                  <td className="py-3">{lot.lot_number}</td>
                  <td>{lot.product_name}</td>
                  <td className="text-slate-400">{lot.producer}</td>
                  <td>{lot.remaining_quantity}/{lot.total_quantity}</td>
                  <td>{lot.expiry_date}</td>
                  <td className={statusColor}>{statusText}</td>
                  <td className="space-x-2">
                    <button
                      onClick={() => setSelectedLot(lot)}
                      className="text-cyan-400 hover:underline"
                    >
                      [details]
                    </button>
                    <button
                      onClick={() => setSelectedQR(lot)}
                      className="text-cyan-400 hover:underline"
                    >
                      [QR]
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-slate-500">No lots found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedQR && <QRModal lot={selectedQR} onClose={() => setSelectedQR(null)} />}
      {selectedLot && <LotDetailModal lot={selectedLot} onClose={() => setSelectedLot(null)} />}
    </div>
  );
}

export const lotsConfig = {
  id: "lots",
  title: "LOTS",
  icon: FlaskConical,
};
