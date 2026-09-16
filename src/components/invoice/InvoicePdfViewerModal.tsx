"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Printer, 
  Loader2, 
  X,
  AlertCircle
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";
import { formatCurrency, formatDate } from "~/lib/utils/format";

export interface InvoicePdfViewerItem {
  id: string;
  invoiceNumber: string;
  status: string;
  currency?: string;
  totalAmount?: number;
  issueDate?: Date | string;
  dueDate?: Date | string;
  receiverName?: string;
}

interface InvoicePdfViewerModalProps {
  invoice: InvoicePdfViewerItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoicePdfViewerModal({
  invoice,
  isOpen,
  onClose,
}: InvoicePdfViewerModalProps) {
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  if (!invoice) return null;

  const inlinePdfUrl = `/api/invoice/${invoice.id}/pdf?disposition=inline`;
  const downloadPdfUrl = `/api/invoice/${invoice.id}/pdf?disposition=attachment`;

  const handleOpenNewTab = () => {
    window.open(inlinePdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(downloadPdfUrl);
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.location.href = downloadPdfUrl;
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById("invoice-pdf-iframe") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      } catch (err) {
        console.warn("Iframe print restricted, opening in new tab:", err);
      }
    }
    window.open(inlinePdfUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/80 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground font-mono">
                  {invoice.invoiceNumber || "Invoice"}
                </DialogTitle>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {invoice.receiverName ? `${invoice.receiverName} • ` : ""}
                {invoice.issueDate ? `Issued: ${formatDate(invoice.issueDate)}` : ""}
                {invoice.totalAmount !== undefined && invoice.currency
                  ? ` • ${formatCurrency(invoice.totalAmount, invoice.currency)}`
                  : ""}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pr-6 sm:pr-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer border-border/80"
              title="Print invoice"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
              className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer border-border/80"
              title="Open PDF in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">New Tab</span>
            </Button>

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-8 px-3 text-xs gap-1.5 cursor-pointer shadow-xs font-medium"
              title="Download PDF"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Viewport Body */}
        <div className="relative flex-1 w-full h-full bg-muted/30 overflow-hidden flex flex-col">
          {isLoadingPdf && !loadError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-xs gap-3">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-xs font-medium text-muted-foreground">
                Rendering invoice PDF document...
              </p>
            </div>
          )}

          {loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive/80" />
              <p className="text-sm font-semibold text-foreground">
                Unable to load PDF preview in iframe
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Your browser or network policy might prevent embedding PDF previews. You can open the document directly or download it.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={handleOpenNewTab} className="text-xs gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="text-xs gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Direct Download</span>
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              id="invoice-pdf-iframe"
              src={inlinePdfUrl}
              className="w-full h-full border-none"
              title={`Invoice ${invoice.invoiceNumber}`}
              onLoad={() => setIsLoadingPdf(false)}
              onError={() => {
                setIsLoadingPdf(false);
                setLoadError("Failed to load PDF preview");
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
