"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Download, 
  ExternalLink,
  FileText,
  Clock,
  Calendar,
  Upload,
  Check
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";
import { UploadReceiptModal } from "~/features/portal/components/UploadReceiptModal";
import { AppRoutes } from "~/config/routes";

export default function PortalInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = params?.id;

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: invoice, isLoading, error } = api.portal.getInvoiceById.useQuery(
    { id: invoiceId! },
    { enabled: !!invoiceId }
  );

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setIsDownloading(true);
      const res = await fetch(`/api/invoice/${invoice.id}/pdf?disposition=attachment`);
      if (!res.ok) throw new Error("Download failed");
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
      window.location.href = `/api/invoice/${invoice.id}/pdf?disposition=attachment`;
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground text-xs font-mono">
        Loading invoice statement...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-foreground font-semibold text-sm">Invoice not found or access denied</p>
        <p className="text-xs text-muted-foreground">You do not have permission to view this invoice or it does not exist.</p>
        <Button
          render={<Link href={AppRoutes.PORTAL_INVOICES} />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="mt-2 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Invoices</span>
        </Button>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const isVerification = invoice.status === "PAYMENT_PENDING_VERIFICATION";
  const inlinePdfUrl = `/api/invoice/${invoice.id}/pdf?disposition=inline`;
  const downloadPdfUrl = `/api/invoice/${invoice.id}/pdf?disposition=attachment`;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href={AppRoutes.PORTAL_INVOICES} />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Statements</span>
          </Button>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-mono text-xs font-bold text-foreground">{invoice.invoiceNumber}</span>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isPaid && (
            <Button
              size="sm"
              onClick={() => setIsReceiptModalOpen(true)}
              className="text-xs h-8 gap-1.5 shadow-2xs font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isVerification ? "Re-upload Proof" : "Submit Payment Proof"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(inlinePdfUrl, "_blank", "noopener,noreferrer")}
            className="text-xs h-8 gap-1.5 cursor-pointer border-border/80"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Open in Tab</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isDownloading}
            onClick={handleDownloadPdf}
            className="text-xs h-8 gap-1.5 cursor-pointer border-border/80"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? "Downloading..." : "Download PDF"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Details Panel + Embedded PDF Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invoice Metadata */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 space-y-4 border-border/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <span className="text-xs text-muted-foreground font-medium block">Total Amount Due</span>
                <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" /> Issue Date
                </span>
                <span className="font-mono text-foreground font-medium">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/70" /> Payment Due
                </span>
                <span className="font-mono text-foreground font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </Card>

          {/* Issuer Details */}
          <Card className="p-5 space-y-3.5 border-border/80 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Issued By
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">{invoice.senderName || invoice.company?.name || "Software Operations"}</p>
              {invoice.senderEmail && (
                <p className="text-xs text-muted-foreground mt-0.5">{invoice.senderEmail}</p>
              )}
            </div>

            {invoice.bankName && (
              <div className="pt-3 border-t border-border/60 text-xs space-y-2">
                <p className="font-semibold text-foreground">Remittance Instructions</p>
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/60 space-y-1">
                  <p className="text-muted-foreground text-[11px]">Bank: <span className="font-semibold text-foreground">{invoice.bankName}</span></p>
                  {invoice.bankAccountNumber && (
                    <p className="text-muted-foreground text-[11px]">Account: <span className="font-mono text-foreground select-all">{invoice.bankAccountNumber}</span></p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Embedded PDF Viewer */}
        <div className="lg:col-span-8">
          <Card className="overflow-hidden border-border/80 bg-card shadow-xs">
            <div className="p-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Statement Document (PDF)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(inlinePdfUrl, "_blank", "noopener,noreferrer")}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDownloading}
                  onClick={handleDownloadPdf}
                  className="h-7 text-xs gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            <div className="w-full h-[780px] bg-muted/20">
              <iframe
                src={inlinePdfUrl}
                className="w-full h-full border-none"
                title={`Invoice ${invoice.invoiceNumber}`}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Upload Receipt Modal */}
      <UploadReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={invoice}
      />
    </div>
  );
}
