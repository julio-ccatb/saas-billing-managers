"use client";

import React, { useState } from "react";
import { 
  Receipt, 
  Search, 
  Upload, 
  Download, 
  Check, 
  Clock, 
  FileText, 
  Eye, 
  AlertCircle 
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "~/components/ui/table";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "~/components/ui/empty";
import { UploadReceiptModal } from "../components/UploadReceiptModal";
import { InvoicePdfViewerModal } from "~/components/invoice/InvoicePdfViewerModal";

export default function PortalInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "PAYMENT_PENDING_VERIFICATION" | "PAID" | "OVERDUE"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const [viewingPdfInvoice, setViewingPdfInvoice] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadPdf = async (inv: any) => {
    try {
      setDownloadingId(inv.id);
      const downloadUrl = `/api/invoice/${inv.id}/pdf?disposition=attachment`;
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${inv.invoiceNumber || inv.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.location.href = `/api/invoice/${inv.id}/pdf?disposition=attachment`;
    } finally {
      setDownloadingId(null);
    }
  };

  const { data: invoices, isLoading } = api.portal.getInvoices.useQuery({
    status: statusFilter,
  });

  const filteredInvoices = invoices?.filter((inv) => {
    if (!searchTerm) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "PAYMENT_PENDING_VERIFICATION":
        return <Badge variant="verification">Verification Pending</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Billing Ledger &amp; Statements
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit historical invoice PDFs, track payment clearing, and submit transfer verification
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3 sm:p-4 border-border/80 shadow-xs bg-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by invoice number or client..."
              className="pl-9 h-9 text-xs bg-background border-border/80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-xl border border-border/60">
            {(
              [
                "ALL",
                "PENDING",
                "PAYMENT_PENDING_VERIFICATION",
                "PAID",
                "OVERDUE",
              ] as const
            ).map((st) => {
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {st === "PAYMENT_PENDING_VERIFICATION"
                    ? "In Verification"
                    : st === "ALL"
                    ? "All Statements"
                    : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Invoices List - Desktop Table & Mobile Card View */}
      <Card className="overflow-hidden border-border/80 shadow-xs">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-muted-foreground font-mono">
            Loading statements...
          </div>
        ) : !filteredInvoices || filteredInvoices.length === 0 ? (
          <div className="p-8">
            <Empty className="py-8">
              <EmptyMedia variant="icon">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No matching statements</EmptyTitle>
              <EmptyDescription>
                We could not find any invoices matching the active filter or search criteria.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs font-semibold text-muted-foreground border-border/60">
                    <TableHead className="py-3.5 px-5">Invoice #</TableHead>
                    <TableHead className="py-3.5 px-5">Issue Date</TableHead>
                    <TableHead className="py-3.5 px-5">Due Date</TableHead>
                    <TableHead className="py-3.5 px-5">Status</TableHead>
                    <TableHead className="py-3.5 px-5 text-right">Amount</TableHead>
                    <TableHead className="py-3.5 px-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {filteredInvoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";
                    const latestReceipt = inv.receipts?.[0];

                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                          <button
                            type="button"
                            onClick={() => setViewingPdfInvoice(inv)}
                            className="text-primary hover:underline flex items-center gap-1.5 font-bold cursor-pointer group"
                            title="Click to view Invoice PDF"
                          >
                            <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span>{inv.invoiceNumber}</span>
                          </button>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                          {formatDate(inv.issueDate)}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                          {formatDate(inv.dueDate)}
                        </TableCell>
                        <TableCell className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(inv.status)}
                            {latestReceipt && (
                              <button
                                onClick={() => setViewingReceipt(latestReceipt)}
                                className="text-[11px] text-muted-foreground hover:text-foreground underline flex items-center gap-1 cursor-pointer"
                                title="View submitted receipt proof"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Proof</span>
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground tabular-nums">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setViewingPdfInvoice(inv)}
                              className="text-xs h-8 px-2.5 gap-1.5 cursor-pointer font-medium shadow-2xs"
                              title="View Invoice PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View PDF</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              disabled={downloadingId === inv.id}
                              onClick={() => handleDownloadPdf(inv)}
                              className="text-xs h-8 px-2.5 gap-1.5 cursor-pointer border-border/80"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>
                                {downloadingId === inv.id ? "..." : "Download"}
                              </span>
                            </Button>

                            {!isPaid && !isVerification && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedInvoiceForReceipt(inv)}
                                className="text-xs h-8 gap-1.5"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Submit Receipt</span>
                              </Button>
                            )}

                            {isVerification && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedInvoiceForReceipt(inv)}
                                className="text-xs h-8 gap-1"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Re-upload</span>
                              </Button>
                            )}

                            {isPaid && (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Cleared
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Responsive Card List */}
            <div className="md:hidden divide-y divide-border/60">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.status === "PAID";
                const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";
                const latestReceipt = inv.receipts?.[0];

                return (
                  <div key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <button
                          type="button"
                          onClick={() => setViewingPdfInvoice(inv)}
                          className="font-mono font-bold text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{inv.invoiceNumber}</span>
                        </button>
                        <span className="text-xs text-muted-foreground block mt-0.5">Due: {formatDate(inv.dueDate)}</span>
                      </div>
                      <div>{getStatusBadge(inv.status)}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1.5 border-y border-border/60">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-bold text-foreground font-mono text-sm tabular-nums">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </span>
                    </div>

                    {latestReceipt && (
                      <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-lg border border-border/60">
                        <span className="text-muted-foreground">Receipt Proof Attached</span>
                        <button
                          onClick={() => setViewingReceipt(latestReceipt)}
                          className="text-primary hover:underline text-xs flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Proof</span>
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setViewingPdfInvoice(inv)}
                        className="flex-1 text-xs h-9 gap-1.5 cursor-pointer font-medium shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingId === inv.id}
                        onClick={() => handleDownloadPdf(inv)}
                        className="text-xs h-9 px-3 gap-1.5 cursor-pointer border-border/80"
                      >
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{downloadingId === inv.id ? "..." : "Download"}</span>
                      </Button>

                      {!isPaid && !isVerification && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedInvoiceForReceipt(inv)}
                          className="w-full text-xs h-9 gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Submit Transfer Receipt</span>
                        </Button>
                      )}

                      {isVerification && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoiceForReceipt(inv)}
                          className="w-full text-xs h-9 gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Re-upload Receipt</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* Upload Receipt Modal */}
      <UploadReceiptModal
        isOpen={!!selectedInvoiceForReceipt}
        onClose={() => setSelectedInvoiceForReceipt(null)}
        invoice={selectedInvoiceForReceipt}
      />

      {/* View Submitted Receipt Proof Dialog */}
      {viewingReceipt && (
        <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-5 pb-3 border-b border-border">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Submitted Payment Proof</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2">
                <span>File: <strong className="text-foreground">{viewingReceipt.fileName}</strong></span>
                <span>Submitted: {formatDate(viewingReceipt.createdAt)}</span>
              </div>

              {viewingReceipt.notes && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs">
                  <p className="font-semibold text-foreground mb-0.5">Client Reference Notes:</p>
                  <p className="text-muted-foreground">{viewingReceipt.notes}</p>
                </div>
              )}

              {/* Preview container */}
              <div className="rounded-xl border border-border overflow-hidden min-h-[220px] max-h-[420px] flex items-center justify-center bg-black/5 dark:bg-black/20">
                {viewingReceipt.mimeType.includes("pdf") ? (
                  <iframe
                    src={viewingReceipt.fileData}
                    className="w-full h-96 border-none"
                    title="Receipt PDF"
                  />
                ) : (
                  <img
                    src={viewingReceipt.fileData}
                    alt={viewingReceipt.fileName}
                    className="max-h-96 w-auto object-contain"
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice PDF Viewer Modal */}
      <InvoicePdfViewerModal
        invoice={viewingPdfInvoice}
        isOpen={!!viewingPdfInvoice}
        onClose={() => setViewingPdfInvoice(null)}
      />
    </div>
  );
}
