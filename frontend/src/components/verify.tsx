"use client";
import { useState, useRef, useEffect } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Upload, Loader2, X } from "lucide-react";
import { verificationStyles, type VerificationStatus } from "@/lib/styles";
import { verifyMedicine, getVerificationStats, getVerificationsByType, getUnverifiedLots, type VerificationResult, type Detection, type VerificationStats, type VerificationRecord, type Lot } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function CroppedImage({
  imageUrl,
  bbox,
  onClick,
  className = ""
}: {
  imageUrl: string;
  bbox: [number, number, number, number];
  onClick?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const img = new Image();
    img.onload = () => {
      const [x1, y1, x2, y2] = bbox;
      const cropWidth = x2 - x1;
      const cropHeight = y2 - y1;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, x1, y1, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, bbox]);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
      style={{ imageRendering: "auto" }}
    />
  );
}

function DetailModal({
  detection,
  imageUrl,
  index,
  onClose
}: {
  detection: Detection;
  imageUrl: string;
  index: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const status = detection.result.toLowerCase() as VerificationStatus;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const img = new Image();
    img.onload = () => {
      const [x1, y1, x2, y2] = detection.bbox;
      const cropWidth = x2 - x1;
      const cropHeight = y2 - y1;

      const maxSize = 300;
      const scale = Math.min(maxSize / cropWidth, maxSize / cropHeight, 2);

      canvas.width = cropWidth * scale;
      canvas.height = cropHeight * scale;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, x1, y1, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = imageUrl;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [imageUrl, detection.bbox, onClose]);

  const labelsMatch = detection.yolo_label.toLowerCase() === detection.cnn_label.toLowerCase();
  const labelColor = labelsMatch ? "text-emerald-400" : "text-red-400";

  const statusColor = status === "genuine" ? "text-emerald-400" :
    status === "suspicious" ? "text-amber-400" : "text-red-400";

  const statusBg = status === "genuine" ? "bg-emerald-500/10 border-emerald-500/50" :
    status === "suspicious" ? "bg-amber-500/10 border-amber-500/50" : "bg-red-500/10 border-red-500/50";

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">Package #{index + 1}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Image */}
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-lg border border-slate-600" />
          </div>

          {/* Result Status */}
          <div className={`rounded-lg p-3 border ${statusBg} text-center`}>
            <div className="flex items-center justify-center gap-2">
              {status === "genuine" ? (
                <CheckCircle2 size={20} className={statusColor} />
              ) : (
                <XCircle size={20} className={statusColor} />
              )}
              <span className={`text-lg font-bold ${statusColor}`}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Detection Details */}
          <div className="space-y-2 text-sm">
            <div className="text-slate-500 text-xs uppercase tracking-wide mb-2">Detection Details</div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">YOLO Detection</div>
                <div className={`font-medium ${labelColor}`}>{detection.yolo_label}</div>
                <div className={`text-sm ${labelColor}`}>
                  {(detection.yolo_confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">CNN Classification</div>
                <div className={`font-medium ${labelColor}`}>{detection.cnn_label}</div>
                <div className={`text-sm ${labelColor}`}>
                  {(detection.cnn_confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Bounding Box */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Bounding Box</div>
              <div className="font-mono text-xs text-slate-400">
                x1: {detection.bbox[0]}, y1: {detection.bbox[1]}, x2: {detection.bbox[2]}, y2: {detection.bbox[3]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetectionCard({
  detection,
  imageUrl,
  index,
}: {
  detection: Detection;
  imageUrl: string;
  index: number;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const status = detection.result.toLowerCase() as VerificationStatus;

  const borderColor = status === "genuine" ? "border-emerald-500" :
    status === "suspicious" ? "border-amber-500" : "border-red-500";

  const confidenceColor = detection.cnn_confidence > 0.8 ? "text-emerald-400" :
    detection.cnn_confidence > 0.5 ? "text-amber-400" : "text-red-400";

  return (
    <>
      <div
        className={`bg-slate-800/70 rounded-lg p-3 border border-slate-700 text-center cursor-pointer transition-all duration-300 ${
          isHovered ? borderColor : ""
        }`}
        style={{ transform: isHovered ? "translateY(-4px)" : "translateY(0)" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setShowModal(true)}
      >
        <CroppedImage
          imageUrl={imageUrl}
          bbox={detection.bbox}
          className="w-full h-32 object-cover rounded border border-slate-600 mb-2"
        />

        <div className="text-sm font-semibold mb-1">Package #{index + 1}</div>

        <div className="flex items-center justify-center gap-1.5 mb-1">
          {status === "genuine" ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <XCircle size={14} className={status === "suspicious" ? "text-amber-400" : "text-red-400"} />
          )}
          <span className={`text-sm font-medium ${verificationStyles[status]?.text ?? "text-slate-400"}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="text-xs">
          <span className="text-slate-500">Confidence: </span>
          <span className={confidenceColor}>{(detection.cnn_confidence * 100).toFixed(1)}%</span>
        </div>

        <div className="text-xs text-slate-600 mt-1.5">Click for details</div>
      </div>

      {showModal && (
        <DetailModal
          detection={detection}
          imageUrl={imageUrl}
          index={index}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// Modal for recent verification items
function RecentItemModal({
  item,
  onClose
}: {
  item: VerificationStats["recent"][0];
  onClose: () => void;
}) {
  const status = item.result.toLowerCase() as VerificationStatus;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const statusColor = status === "genuine" ? "text-emerald-400" :
    status === "suspicious" ? "text-amber-400" : "text-red-400";

  const statusBg = status === "genuine" ? "bg-emerald-500/10 border-emerald-500/50" :
    status === "suspicious" ? "bg-amber-500/10 border-amber-500/50" : "bg-red-500/10 border-red-500/50";

  const confidenceColor = item.confidence > 0.8 ? "text-emerald-400" :
    item.confidence > 0.5 ? "text-amber-400" : "text-red-400";

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
          <h3 className="text-lg font-semibold">Verification Record</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {item.image && (
            <div className="flex justify-center">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:8000'}${item.image}`}
                alt={item.image_name || "Verification"}
                className="rounded-lg border border-slate-600 max-h-48 object-contain"
              />
            </div>
          )}

          <div className={`rounded-lg p-3 border ${statusBg} text-center`}>
            <div className="flex items-center justify-center gap-2">
              {status === "genuine" ? (
                <CheckCircle2 size={20} className={statusColor} />
              ) : (
                <XCircle size={20} className={statusColor} />
              )}
              <span className={`text-lg font-bold ${statusColor}`}>
                {status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Confidence</div>
              <div className={`font-medium ${confidenceColor}`}>
                {(item.confidence * 100).toFixed(1)}%
              </div>
            </div>

            {item.image_name && (
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-slate-500 text-xs mb-1">Image</div>
                <div className="text-slate-300 text-xs break-all">
                  {item.image_name}
                </div>
              </div>
            )}

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Image Hash</div>
              <div className="font-mono text-xs text-slate-400 break-all">
                {item.hash}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">Verified At</div>
              <div className="text-slate-300">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilteredRecordsModal({
  resultType,
  onClose,
}: {
  resultType: string;
  onClose: () => void;
}) {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);

  useEffect(() => {
    getVerificationsByType(resultType)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, [resultType]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    genuine: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/50" },
    suspicious: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/50" },
    counterfeit: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/50" },
  };
  const colors = colorMap[resultType.toLowerCase()] ?? colorMap.genuine;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg border border-slate-700 max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className={`text-lg font-semibold ${colors.text}`}>
            {resultType.charAt(0).toUpperCase() + resultType.slice(1)} Records
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="text-cyan-500 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-slate-500 text-center py-8">No records found</div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const conf = r.confidence > 0.8 ? "text-emerald-400" : r.confidence > 0.5 ? "text-amber-400" : "text-red-400";
                return (
                  <div key={r.id} onClick={() => setSelectedRecord(r)} className={`rounded-lg p-3 border cursor-pointer hover:brightness-125 transition-all ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${colors.text}`}>{r.result}</span>
                      <span className={`text-sm ${conf}`}>{(r.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">{r.image_name || r.hash}</span>
                      <span className="shrink-0 ml-2">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedRecord && (
          <RecentItemModal
            item={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </div>
    </div>
  );
}

export function VerifyCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<VerificationStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<VerificationStats["recent"][0] | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showAllRecent, setShowAllRecent] = useState(false);

  useEffect(() => {
    getVerificationStats()
      .then(setData)
      .catch(() => setData(null));
  }, [refreshKey]);

  const stats = data?.stats ?? { genuine: 0, suspicious: 0, counterfeit: 0 };
  const recent = data?.recent ?? [];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div
          onClick={() => stats.genuine > 0 && setFilterType("genuine")}
          className={`bg-slate-800/50 rounded-lg p-2 transition-colors ${stats.genuine > 0 ? "cursor-pointer hover:bg-emerald-500/10 hover:ring-1 hover:ring-emerald-500/30" : ""}`}
        >
          <div className="text-lg font-bold text-emerald-400">{stats.genuine}</div>
          <div className="text-xs text-slate-500">Genuine</div>
        </div>
        <div
          onClick={() => stats.suspicious > 0 && setFilterType("suspicious")}
          className={`bg-slate-800/50 rounded-lg p-2 transition-colors ${stats.suspicious > 0 ? "cursor-pointer hover:bg-amber-500/10 hover:ring-1 hover:ring-amber-500/30" : ""}`}
        >
          <div className="text-lg font-bold text-amber-400">{stats.suspicious}</div>
          <div className="text-xs text-slate-500">Suspicious</div>
        </div>
        <div
          onClick={() => stats.counterfeit > 0 && setFilterType("counterfeit")}
          className={`bg-slate-800/50 rounded-lg p-2 transition-colors ${stats.counterfeit > 0 ? "cursor-pointer hover:bg-red-500/10 hover:ring-1 hover:ring-red-500/30" : ""}`}
        >
          <div className="text-lg font-bold text-red-400">{stats.counterfeit}</div>
          <div className="text-xs text-slate-500">Counterfeit</div>
        </div>
      </div>

      <div
        onClick={() => (data?.total ?? 0) > 0 && setShowAllRecent(true)}
        className={`flex-1 bg-slate-800/30 rounded-lg flex flex-col items-center justify-center text-center transition-colors ${(data?.total ?? 0) > 0 ? "cursor-pointer hover:bg-cyan-500/10 hover:ring-1 hover:ring-cyan-500/30" : ""}`}
      >
        <div className="text-4xl font-bold text-cyan-400">{data?.total ?? 0}</div>
        <div className="text-xs text-slate-500 mt-1">Total Verifications</div>
      </div>

      {filterType && (
        <FilteredRecordsModal
          resultType={filterType}
          onClose={() => setFilterType(null)}
        />
      )}

      {showAllRecent && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAllRecent(false)}
        >
          <div
            className="bg-slate-900 rounded-lg border border-slate-700 max-w-lg w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-cyan-400">Recent Verifications</h3>
              <button onClick={() => setShowAllRecent(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recent.map((item) => {
                const s = item.result.toLowerCase() as VerificationStatus;
                const conf = item.confidence > 0.8 ? "text-emerald-400" : item.confidence > 0.5 ? "text-amber-400" : "text-red-400";
                const itemColors = s === "genuine"
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                  : s === "suspicious"
                  ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400";
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`rounded-lg p-3 border cursor-pointer hover:brightness-125 transition-all ${itemColors}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.result}</span>
                      <span className={`text-sm ${conf}`}>{(item.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">{item.image_name || item.hash}</span>
                      <span className="shrink-0 ml-2">{new Date(item.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <RecentItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

interface VerifyExpandedProps {
  result: VerificationResult | null;
  setResult: (result: VerificationResult | null) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function VerifyExpanded({
  result,
  setResult,
  imageUrl,
  setImageUrl,
  error,
  setError,
}: VerifyExpandedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const showLotSelector = user && !["PHARMACY", "CONSUMER"].includes(user.role);

  useEffect(() => {
    if (showLotSelector) {
      getUnverifiedLots().then(setLots).catch(() => setLots([]));
    }
  }, [showLotSelector]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const data = await verifyMedicine(file, selectedLotId || undefined);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-400">Upload an image to verify medicine authenticity.</p>

      {/* Lot selection - only for ADMIN, MANUFACTURER, DISTRIBUTOR */}
      {showLotSelector && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Link to Lot:</label>
          <select
            value={selectedLotId}
            onChange={(e) => setSelectedLotId(e.target.value)}
            className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-cyan-400 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">None (unlinked)</option>
            {lots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.lot_number} - {lot.product_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border border-dashed border-cyan-500/50 rounded-lg p-12 text-center hover:border-cyan-400 hover:bg-cyan-500/5 transition-colors cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        {isLoading ? (
          <Loader2 size={48} className="mx-auto mb-2 text-cyan-500 animate-spin" />
        ) : (
          <Upload size={48} className="mx-auto mb-2 text-cyan-500" />
        )}
        <p className="text-slate-500">
          {isLoading ? "Analyzing..." : "Drop image here or click to upload"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* No detection */}
      {result && result.detections.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-slate-400">
          No medicine packaging detected in image.
        </div>
      )}

      {result && result.detections.length > 0 && imageUrl && (
        <div className="space-y-4">
          <div className={`rounded-lg p-4 ${
            result.blockchain?.already_verified
              ? "bg-amber-500/10 border border-amber-500/50"
              : "bg-emerald-500/10 border border-emerald-500/50"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold mb-1 ${
                  result.blockchain?.already_verified ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {result.blockchain?.already_verified ? "Record Exists" : "New Record"}
                </h3>
                <p className="text-slate-300">
                  {result.detections.length} package{result.detections.length > 1 ? "s" : ""} detected
                </p>
              </div>
              {result.blockchain && (
                <div className="text-xs text-right">
                  <div className="text-slate-500">Block: <span className="text-slate-400">{result.blockchain.block}</span></div>
                  <div className="text-slate-500 max-w-50 truncate">
                    Tx: <span className="text-slate-400">{result.blockchain.tx_hash}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending approval notice */}
          {!result.blockchain?.already_verified && (
            <div className="rounded-lg p-3 bg-cyan-500/10 border border-cyan-500/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 text-sm font-medium">Pending Approval</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                This verification needs approval before it will be linked to the lot. Go to the lot details to approve.
              </p>
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {result.detections.map((detection, i) => (
              <DetectionCard
                key={i}
                detection={detection}
                imageUrl={imageUrl}
                index={i}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// Export config for page.tsx
export const verifyConfig = {
  id: "verify",
  title: "VERIFY",
  icon: ShieldCheck,
};
