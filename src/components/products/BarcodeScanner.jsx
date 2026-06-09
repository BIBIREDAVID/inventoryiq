import { useEffect, useRef } from "react";

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    let html5QrCode;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode("qr-reader");
        instanceRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
            html5QrCode.stop();
          },
          () => {}
        );
      } catch (err) {
        console.error("Scanner error:", err);
      }
    }

    startScanner();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
          <h3 className="text-white font-semibold">Scan Barcode / QR</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">×</button>
        </div>
        <div className="p-5">
          <div id="qr-reader" ref={scannerRef} className="rounded-lg overflow-hidden" />
          <p className="text-slate-400 text-xs text-center mt-3">
            Point your camera at a barcode or QR code
          </p>
          <button onClick={onClose}
            className="w-full mt-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
