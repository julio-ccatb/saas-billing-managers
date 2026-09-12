"use client";

import React, { useState } from "react";
import { useInvoiceForm } from "./InvoiceFormContext";
import { 
  Printer, 
  Download, 
  Palette, 
  Layout, 
  Loader2,
  Check
} from "lucide-react";
import { INVOICE_TEMPLATES, ACCENT_COLORS } from "~/lib/templates/invoiceTemplates";
import { getTemplateComponent } from "~/server/services/renderHtml";

export function InvoicePreviewCard() {
  const { invoice, updateField } = useInvoiceForm();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const res = await fetch("/api/invoice/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });

      if (!res.ok) {
        throw new Error("Server failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber || "draft"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}. You can also use the "Print / Save PDF" button.`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sticky top-6">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="preview-toolbar bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* 13 Numbered Templates Selector */}
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-gray-500" />
          <select
            aria-label="Invoice template"
            className="text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 font-medium text-gray-700"
            value={invoice.templateId}
            onChange={(e) => updateField("templateId", e.target.value)}
          >
            {INVOICE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Palette Presets */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-gray-400 mr-1" />
          {ACCENT_COLORS.map((c) => {
            const isSelected = invoice.themeColor === c.value;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => updateField("themeColor", c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                  isSelected ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105 opacity-85"
                }`}
                title={c.name}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}
        </div>

        {/* Actions: Native Print + Puppeteer PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Open browser print dialog / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Download PDF via headless server"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPdf ? "Rendering..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Sheet */}
      <div className="invoice-printable-card bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {getTemplateComponent(invoice)}
      </div>
    </div>
  );
}
