"use client";

import React, { useRef, useState } from "react";
import { Upload, Image as ImageIcon, Trash2 } from "lucide-react";

interface LogoUploaderProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
}

export function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 2MB to keep database payload and Puppeteer fast
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be under 2MB");
      return;
    }

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    const isImage = file.type.startsWith("image/") || isSvg;

    if (!isImage) {
      setError("File must be an image (PNG, JPG, SVG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let base64 = event.target?.result as string;
      if (base64) {
        // If an SVG was loaded without xml mime prefix, normalize it
        if (isSvg && !base64.startsWith("data:image/svg+xml")) {
          const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
          base64 = `data:image/svg+xml;base64,${cleanBase64}`;
        }
        onChange(base64);
      }
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        Company Logo
      </label>

      {value ? (
        <div className="relative group inline-flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
          <img
            src={value}
            alt="Invoice Logo"
            className="h-12 w-auto max-w-[140px] object-contain rounded"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-white transition-colors cursor-pointer"
            title="Remove Logo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 hover:border-blue-500 rounded-lg bg-gray-50/70 hover:bg-blue-50/50 text-xs font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Logo (PNG, JPG, SVG)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
