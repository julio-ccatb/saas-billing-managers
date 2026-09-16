"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Edit3, 
  Download, 
  Mail, 
  CheckCircle2, 
  Printer, 
  ExternalLink,
  FileText,
  Clock,
  User,
  Building2,
  Calendar
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";
import { SendInvoiceModal } from "~/components/invoice/SendInvoiceModal";
import { VerifyPaymentProofModal } from "~/components/invoice/VerifyPaymentProofModal";
import { AppRoutes } from "~/config/routes";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const invoiceId = params?.id;

  const [sendingInvoice, setSendingInvoice] = useState<any>(null);
  const [reviewingReceipt, setReviewingReceipt] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const utils = api.useUtils();

  const { data: invoice, isLoading, error } = api.invoice.getById.useQuery(
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

  const updateStatusMutation = api.invoice.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoice.getById.invalidate({ id: invoiceId });
      utils.invoice.getAll.invalidate();
    },
  });

  const sendEmailMutation = api.invoice.sendEmail.useMutation({
    onSuccess: () => {
      setSendingInvoice(null);
      alert("Invoice email dispatched successfully via Resend.");
      utils.invoice.getById.invalidate({ id: invoiceId });
    },
    onError: (err) => {
      alert(`Failed to send email: ${err.message}`);
    },
  });

  const verifyReceiptMutation = api.invoice.verifyReceipt.useMutation({
    onSuccess: () => {
      setReviewingReceipt(null);
      utils.invoice.getById.invalidate({ id: invoiceId });
      utils.invoice.getAll.invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground text-xs font-mono">
        Loading invoice details...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-foreground font-semibold text-sm">Invoice not found or access denied</p>
        <p className="text-xs text-muted-foreground">The requested invoice does not exist or you do not have permission to view it.</p>
        <Button
          render={<Link href={AppRoutes.INVOICES} />}
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

  const inlinePdfUrl = `/api/invoice/${invoice.id}/pdf?disposition=inline`;
  const downloadPdfUrl = `/api/invoice/${invoice.id}/pdf?disposition=attachment`;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href={AppRoutes.INVOICES} />}
            nativeButton={false}
            variant="ghost"
            size="sm"
            className="text-xs gap-1 h-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Invoices</span>
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-mono text-xs font-bold text-foreground">{invoice.invoiceNumber}</span>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {invoice.status !== "PAID" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: "PAID" })}
              disabled={updateStatusMutation.isPending}
              className="text-xs h-8 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Paid</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSendingInvoice(invoice)}
            className="text-xs h-8 gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Send Email</span>
          </Button>

          <Button
            render={<Link href={AppRoutes.INVOICE_EDIT(invoice.id)} />}
            nativeButton={false}
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Edit</span>
          </Button>

          <Button
            size="sm"
            disabled={isDownloading}
            onClick={handleDownloadPdf}
            className="text-xs h-8 gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? "Downloading..." : "Download PDF"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Details Panel + Embedded PDF Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Metadata & Details */}
        <div className="lg:col-span-4 space-y-4">
          {/* Summary Card */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="text-xs text-muted-foreground block">Total Amount</span>
                <span className="text-2xl font-bold font-mono text-foreground">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Issue Date
                </span>
                <span className="font-mono text-foreground">{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Due Date
                </span>
                <span className="font-mono text-foreground">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </Card>

          {/* Client & Sender Card */}
          <Card className="p-4 space-y-4">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Billed To
              </span>
              <p className="text-sm font-bold text-foreground">{invoice.receiverName || "Anonymous Client"}</p>
              {invoice.receiverEmail && (
                <p className="text-xs text-muted-foreground">{invoice.receiverEmail}</p>
              )}
              {invoice.receiverAddress && (
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{invoice.receiverAddress}</p>
              )}
            </div>

            <div className="pt-3 border-t border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Issued By
              </span>
              <p className="text-sm font-bold text-foreground">{invoice.senderName || "Company"}</p>
              {invoice.senderEmail && (
                <p className="text-xs text-muted-foreground">{invoice.senderEmail}</p>
              )}
            </div>
          </Card>

          {/* Payment Proofs if any */}
          {invoice.receipts && invoice.receipts.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Payment Receipts ({invoice.receipts.length})</span>
                </span>
              </div>
              {invoice.receipts.map((rcpt: any) => (
                <div key={rcpt.id} className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs flex items-center justify-between">
                  <div className="truncate mr-2">
                    <p className="font-medium text-foreground truncate">{rcpt.fileName}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(rcpt.createdAt)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReviewingReceipt({ ...rcpt, invoice })}
                    className="h-7 text-xs px-2"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Right Column: Embedded PDF Viewer */}
        <div className="lg:col-span-8">
          <Card className="overflow-hidden border-border bg-card">
            <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Document PDF Viewer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(inlinePdfUrl, "_blank", "noopener,noreferrer")}
                  className="h-7 text-xs gap-1 cursor-pointer"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Tab</span>
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

            <div className="w-full h-[800px] bg-muted/20">
              <iframe
                src={inlinePdfUrl}
                className="w-full h-full border-none"
                title={`Invoice ${invoice.invoiceNumber}`}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Send Invoice Modal */}
      <SendInvoiceModal
        invoice={sendingInvoice}
        isOpen={!!sendingInvoice}
        onClose={() => setSendingInvoice(null)}
        onSend={({ recipientEmail, customMessage }) => {
          if (!sendingInvoice) return;
          sendEmailMutation.mutate({
            id: sendingInvoice.id,
            recipientEmail,
            customMessage,
          });
        }}
        isSending={sendEmailMutation.isPending}
      />

      {/* Verify Receipt Modal */}
      <VerifyPaymentProofModal
        receipt={reviewingReceipt}
        isOpen={!!reviewingReceipt}
        onClose={() => setReviewingReceipt(null)}
        onApprove={(receiptId) => {
          verifyReceiptMutation.mutate({
            receiptId,
            action: "APPROVE",
          });
        }}
        onReject={(receiptId, reason) => {
          verifyReceiptMutation.mutate({
            receiptId,
            action: "REJECT",
            reason,
          });
        }}
        isProcessing={verifyReceiptMutation.isPending}
      />
    </div>
  );
}
