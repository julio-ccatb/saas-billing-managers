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
import { UploadReceiptModal } from "../components/UploadReceiptModal";

export default function PortalInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "PAYMENT_PENDING_VERIFICATION" | "PAID" | "OVERDUE"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Billing Ledger &amp; Invoices
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          View your issued statements, status changes, and submit payment verifications
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search invoice number..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(
              [
                "ALL",
                "PENDING",
                "PAYMENT_PENDING_VERIFICATION",
                "PAID",
                "OVERDUE",
              ] as const
            ).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {st === "PAYMENT_PENDING_VERIFICATION"
                  ? "In Verification"
                  : st === "ALL"
                  ? "All Statements"
                  : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-5">Issue Date</th>
                <th className="py-3.5 px-5">Due Date</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Amount</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    Loading invoices...
                  </td>
                </tr>
              ) : !filteredInvoices || filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-xs text-muted-foreground">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";
                  const latestReceipt = inv.receipts?.[0];

                  return (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-5">
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
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
