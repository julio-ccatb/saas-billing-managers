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
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

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
    <div className="space-y-4 lg:sticky lg:top-6 w-full">
      {/* Top Toolbar (Hidden when printing) */}
      <Card className="preview-toolbar p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs bg-card border-border">
        {/* Templates Selector */}
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary shrink-0" />
          <select
            aria-label="Invoice template"
            className="text-xs bg-muted border border-input rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
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
        <div className="flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-muted-foreground mr-0.5 shrink-0" />
          <div className="flex items-center gap-1.5">
            {ACCENT_COLORS.map((c) => {
              const isSelected = invoice.themeColor === c.value;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => updateField("themeColor", c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105 opacity-85"
                  }`}
                  title={c.name}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions: Native Print + Puppeteer PDF */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs font-semibold gap-1.5"
            title="Open browser print dialog / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            className="h-8 text-xs font-semibold gap-1.5 shadow-xs"
            title="Download PDF via headless server"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPdf ? "Rendering..." : "Download PDF"}</span>
          </Button>
        </div>
      </Card>

      {/* Invoice Document Sheet */}
      <div className="invoice-printable-card bg-white text-gray-900 rounded-xl shadow-md border border-border overflow-x-auto w-full">
        <div className="w-full">
          {getTemplateComponent(invoice)}
        </div>
      </div>
    </div>
  );
}
