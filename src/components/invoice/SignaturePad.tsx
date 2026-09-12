"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenTool, Type, Upload, Trash2, Check, X, Eraser } from "lucide-react";

interface SignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"draw" | "type" | "upload">("draw");
  const [typedText, setTypedText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (isOpen && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [isOpen, activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? (e.touches[0]?.clientX ?? 0) - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? (e.touches[0]?.clientY ?? 0) - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? (e.touches[0]?.clientX ?? 0) - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? (e.touches[0]?.clientY ?? 0) - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    setIsOpen(false);
  };

  const handleSaveType = () => {
    if (!typedText.trim()) return;
    // Generate an image from typed cursive font on an offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = 400;
    offscreen.height = 100;
    const ctx = offscreen.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#111827";
      ctx.font = "italic 38px 'Dancing Script', cursive, sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, 20, 50);
      onChange(offscreen.toDataURL("image/png"));
    }
    setIsOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const reader = new FileReader();
    reader.onload = (event) => {
      let base64 = event.target?.result as string;
      if (base64) {
        if (isSvg && !base64.startsWith("data:image/svg+xml")) {
          const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
          base64 = `data:image/svg+xml;base64,${cleanBase64}`;
        }
        onChange(base64);
        setIsOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        Authorized Signature
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <img
            src={value}
            alt="Invoice Signature"
            className="h-12 w-auto max-w-[180px] object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors cursor-pointer"
            title="Remove Signature"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 hover:border-blue-500 rounded-lg bg-gray-50/70 hover:bg-blue-50/50 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Add Signature (Draw / Type / Upload)</span>
        </button>
      )}

      {/* Signature Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Add Signature</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/70 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("draw")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === "draw"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <PenTool className="w-3.5 h-3.5" /> Draw
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("type")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === "type"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Type className="w-3.5 h-3.5" /> Type
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-white text-blue-600 shadow-xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="p-5">
              {activeTab === "draw" && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Sign with your mouse, trackpad, or finger below:</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <canvas
                      ref={canvasRef}
                      width={460}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 touch-none cursor-crosshair bg-white"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
                    >
                      <Eraser className="w-3.5 h-3.5" /> Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraw}
                      className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Apply Signature
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "type" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type your full name:
                    </label>
                    <input
                      type="text"
                      value={typedText}
                      onChange={(e) => setTypedText(e.target.value)}
                      placeholder="e.g. Johnathan Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  {typedText && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p
                        className="text-3xl text-gray-900 select-none"
                        style={{ fontFamily: "'Dancing Script', cursive, sans-serif" }}
                      >
                        {typedText}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={!typedText.trim()}
                      onClick={handleSaveType}
                      className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Apply Signature
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "upload" && (
                <div className="space-y-4 text-center py-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 cursor-pointer bg-gray-50/50 hover:bg-blue-50/20 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">Upload signature file</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, SVG with transparent or white background</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
