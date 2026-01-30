"use client";
import { useState, useRef } from "react";
import { QrCode, Upload, Package, Calendar, Building2, Hash, AlertCircle, CheckCircle2, Loader2, ImageIcon } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { getLotById, type LotDetail } from "@/lib/api";

type ScanState = "idle" | "loading" | "success" | "error";

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [lot, setLot] = useState<LotDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanState("loading");
    setError(null);
    setLot(null);

    try {
      // Decode QR from image
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();

      // Fetch lot data using decoded text (lot ID)
      await fetchLotData(decodedText);
    } catch (err) {
      console.error("Failed to decode QR:", err);
      setError("Could not read QR code from image. Please ensure the image contains a valid QR code.");
      setScanState("error");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fetchLotData = async (lotId: string) => {
    try {
      const data = await getLotById(lotId);
      setLot(data);
      setScanState("success");
    } catch (err) {
      console.error("Failed to fetch lot:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch lot data");
      setScanState("error");
    }
  };

  const reset = () => {
    setScanState("idle");
    setLot(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Check if lot is expired
  const isExpired = lot ? new Date(lot.expiry_date) < new Date() : false;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-200 flex items-center gap-3">
          <QrCode className="text-cyan-400" size={28} />
          QR Scanner
        </h1>
        <p className="text-slate-500 mt-1">Upload a QR code image to view lot details</p>
      </div>

      {/* Hidden element for QR decoding */}
      <div id="qr-reader-hidden" style={{ display: "none" }} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Scanner Area */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        {scanState === "idle" && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
              <ImageIcon size={40} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">Upload QR Code</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">
              Select an image containing a medicine lot QR code to view its information
            </p>
            <button
              onClick={triggerFileSelect}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Upload size={18} />
              Select Image
            </button>
          </div>
        )}

        {scanState === "loading" && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            {previewUrl && (
              <div className="mb-4 p-2 bg-slate-800 rounded-lg">
                <img src={previewUrl} alt="QR Code" className="max-w-48 max-h-48 object-contain" />
              </div>
            )}
            <Loader2 size={32} className="text-cyan-400 animate-spin mb-4" />
            <p className="text-slate-400">Reading QR code...</p>
          </div>
        )}

        {scanState === "error" && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            {previewUrl && (
              <div className="mb-4 p-2 bg-slate-800 rounded-lg">
                <img src={previewUrl} alt="QR Code" className="max-w-48 max-h-48 object-contain opacity-50" />
              </div>
            )}
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-red-400 mb-2">Scan Failed</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={triggerFileSelect}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium rounded-lg transition-colors"
              >
                Try Another Image
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {scanState === "success" && lot && (
          <div className="p-6">
            {/* Success Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-emerald-400">Lot Found</h3>
                <p className="text-slate-500 text-sm">QR code successfully scanned</p>
              </div>
              {previewUrl && (
                <div className="p-1 bg-slate-800 rounded">
                  <img src={previewUrl} alt="QR Code" className="w-12 h-12 object-contain" />
                </div>
              )}
            </div>

            {/* Lot Details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package size={20} className="text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Product</p>
                  <p className="text-slate-200 font-medium">{lot.product_name}</p>
                  <p className="text-slate-500 text-sm">Code: {lot.product_code}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash size={20} className="text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Lot Number</p>
                  <p className="text-slate-200 font-medium font-mono">{lot.lot_number}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 size={20} className="text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Producer</p>
                  <p className="text-slate-200 font-medium">{lot.producer}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Dates</p>
                  <p className="text-slate-300 text-sm">
                    Manufactured: <span className="text-slate-200">{new Date(lot.manufacture_date).toLocaleDateString()}</span>
                  </p>
                  <p className="text-slate-300 text-sm">
                    Expires:{" "}
                    <span className={isExpired ? "text-red-400" : "text-slate-200"}>
                      {new Date(lot.expiry_date).toLocaleDateString()}
                      {isExpired && " (EXPIRED)"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Total Quantity</p>
                  <p className="text-2xl font-semibold text-slate-200">{lot.total_quantity.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wide">Remaining</p>
                  <p className="text-2xl font-semibold text-cyan-400">{lot.remaining_quantity.toLocaleString()}</p>
                </div>
              </div>

              {lot.blockchain_txid && (
                <div className="pt-4 border-t border-slate-800">
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Blockchain TX</p>
                  <p className="text-slate-400 text-xs font-mono break-all">{lot.blockchain_txid}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={triggerFileSelect}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <QrCode size={18} />
                Scan Another
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
