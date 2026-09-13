"use client";

import React, { useRef, useState, useEffect } from "react";
import { PenTool, Type, Upload, Trash2, Check, X, Eraser } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";

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
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2.4;
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
    const offscreen = document.createElement("canvas");
    offscreen.width = 400;
    offscreen.height = 100;
    const ctx = offscreen.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0f172a";
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
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        Authorized Signature
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border rounded-xl">
          <img
            src={value}
            alt="Invoice Signature"
            className="h-12 w-auto max-w-[180px] object-contain"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-card"
            title="Remove Signature"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-input hover:border-primary rounded-lg bg-card hover:bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full justify-center min-h-[44px]"
        >
          <PenTool className="w-3.5 h-3.5 text-primary" />
          <span>Add Signature (Draw / Type / Upload)</span>
        </button>
      )}

      {/* Signature Modal with shadcn Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2 border-b border-border">
            <DialogTitle>Add Signature</DialogTitle>
          </DialogHeader>

          {/* Modal Tabs */}
          <div className="flex border-b border-border bg-muted/40 p-1.5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("draw")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "draw"
                  ? "bg-card text-primary shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" /> Draw
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("type")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "type"
                  ? "bg-card text-primary shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Type
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === "upload"
                  ? "bg-card text-primary shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload Image
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-5">
            {activeTab === "draw" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Sign with your mouse, trackpad, or finger below:</p>
                <div className="border border-input rounded-xl overflow-hidden bg-muted/20">
                  <canvas
                    ref={canvasRef}
                    width={440}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCanvas}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveDraw}
                    className="gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Apply Signature
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "type" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Type your full name:
                  </label>
                  <Input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                  />
                </div>

                {typedText && (
                  <div className="p-4 bg-muted/30 border border-border rounded-xl text-center">
                    <p
                      className="text-3xl text-foreground select-none"
                      style={{ fontFamily: "'Dancing Script', cursive, sans-serif" }}
                    >
                      {typedText}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    disabled={!typedText.trim()}
                    onClick={handleSaveType}
                    className="gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Apply Signature
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "upload" && (
              <div className="space-y-4 text-center py-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-input hover:border-primary rounded-xl p-6 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">Upload signature file</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, SVG with transparent background</p>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
