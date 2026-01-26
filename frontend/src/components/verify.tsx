"use client";
import { useState, useRef, useEffect } from "react";
import { ShieldCheck, CheckCircle2, XCircle, Upload, Loader2, X, Maximize2 } from "lucide-react";
import { verificationStyles, type VerificationStatus } from "@/lib/styles";
import { verifyMedicine, getVerificationStats, type VerificationResult, type Detection, type VerificationStats } from "@/lib/api";

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

function ImageModal({
  imageUrl,
  bbox,
  onClose
}: {
  imageUrl: string;
  bbox: [number, number, number, number];
  onClose: () => void;
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

      const maxSize = 800;
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
  }, [imageUrl, bbox, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>
    </div>
  );
}

function DetectionCard({
  detection,
  imageUrl,
}: {
  detection: Detection;
  imageUrl: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const status = detection.result.toLowerCase() as VerificationStatus;

  const borderColor = status === "genuine" ? "border-emerald-500" :
    status === "suspicious" ? "border-amber-500" : "border-red-500";
  const defaultBorder = "border-slate-700";

  return (
    <>
      <div
        className={`bg-slate-800/70 rounded-lg p-4 border text-center transition-all duration-300 ${
          isHovered ? borderColor : defaultBorder
        }`}
        style={{ transform: isHovered ? "translateY(-4px)" : "translateY(0)" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative group mb-3">
          <CroppedImage
            imageUrl={imageUrl}
            bbox={detection.bbox}
            onClick={() => setShowModal(true)}
            className="w-full h-36 object-cover rounded border border-slate-600"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/30 rounded">
            <Maximize2 size={20} className="text-white drop-shadow-lg" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          {status === "genuine" ? (
            <CheckCircle2 size={18} className="text-emerald-400" />
          ) : (
            <XCircle size={18} className={status === "suspicious" ? "text-amber-400" : "text-red-400"} />
          )}
          <span className={`font-bold ${verificationStyles[status]?.text ?? "text-slate-400"}`}>
            {status.toUpperCase()}
          </span>
        </div>

        <div className="text-xs space-y-1">
          <div className="text-slate-500">
            YOLO: <span className="text-slate-300">{detection.yolo_label}</span>
            <span className={`ml-1 ${
              detection.yolo_confidence > 0.8 ? "text-emerald-400" :
              detection.yolo_confidence > 0.5 ? "text-amber-400" : "text-red-400"
            }`}>
              {(detection.yolo_confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-slate-500">
            CNN: <span className="text-slate-300">{detection.cnn_label}</span>
            <span className={`ml-1 ${
              detection.cnn_confidence > 0.8 ? "text-emerald-400" :
              detection.cnn_confidence > 0.5 ? "text-amber-400" : "text-red-400"
            }`}>
              {(detection.cnn_confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600 mt-2">Click image for details</div>
      </div>

      {showModal && (
        <ImageModal
          imageUrl={imageUrl}
          bbox={detection.bbox}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// Card view - shows on dashboard
export function VerifyCard() {
  const [data, setData] = useState<VerificationStats | null>(null);

  useEffect(() => {
    getVerificationStats()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const stats = data?.stats ?? { genuine: 0, suspicious: 0, counterfeit: 0 };
  const recent = data?.recent ?? [];

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

      {/* Total count */}
      <div className="bg-slate-800/30 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-cyan-400">{data?.total ?? 0}</div>
        <div className="text-xs text-slate-500">Total Verifications</div>
      </div>

      {/* Recent */}
      <div className="space-y-1 text-xs">
        {recent.length === 0 ? (
          <div className="text-slate-500 text-center py-2">No verifications yet</div>
        ) : (
          recent.slice(0, 3).map((item) => {
            const status = item.result.toLowerCase() as VerificationStatus;
            return (
              <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400 truncate">{item.hash}</span>
                {status === "genuine" ? (
                  <CheckCircle2 size={14} className={verificationStyles[status]?.text ?? "text-slate-400"} />
                ) : (
                  <XCircle size={14} className={verificationStyles[status]?.text ?? "text-slate-400"} />
                )}
              </div>
            );
          })
        )}
      </div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const data = await verifyMedicine(file);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.detections.map((detection, i) => (
              <DetectionCard
                key={i}
                detection={detection}
                imageUrl={imageUrl}
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
