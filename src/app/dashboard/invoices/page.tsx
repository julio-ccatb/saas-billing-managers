"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  FileText,
  Download
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { AppRoutes } from "~/config/routes";
import { VerifyPaymentProofModal } from "~/components/invoice/VerifyPaymentProofModal";

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "DRAFT" | "PENDING" | "PAYMENT_PENDING_VERIFICATION" | "PAID" | "OVERDUE"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [reviewingReceipt, setReviewingReceipt] = useState<any>(null);

  const utils = api.useUtils();

  const { data, isLoading } = api.invoice.getAll.useQuery({
    status: statusFilter,
    search: searchTerm,
    page,
    pageSize: 15,
  });

  const updateStatusMutation = api.invoice.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoice.getAll.invalidate();
      utils.invoice.getMetrics.invalidate();
    },
  });

  const deleteMutation = api.invoice.delete.useMutation({
    onSuccess: () => {
      utils.invoice.getAll.invalidate();
      utils.invoice.getMetrics.invalidate();
    },
  });

  const verifyReceiptMutation = api.invoice.verifyReceipt.useMutation({
    onSuccess: () => {
      utils.invoice.getAll.invalidate();
      utils.invoice.getMetrics.invalidate();
      setReviewingReceipt(null);
    },
    onError: (err) => {
      alert(`Verification error: ${err.message}`);
    },
  });

  const handleDownloadPdf = async (inv: any) => {
    try {
      setDownloadingId(inv.id);
      const res = await fetch("/api/invoice/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${inv.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error downloading PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "PAYMENT_PENDING_VERIFICATION":
        return <Badge variant="verification">Verification Pending</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Invoices</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage, track, and issue billing statements</p>
          </div>
          <Button
            render={<Link href={AppRoutes.INVOICE_NEW()} />}
            nativeButton={false}
            className="gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search invoice # or client..."
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(["ALL", "PENDING", "PAYMENT_PENDING_VERIFICATION", "PAID", "OVERDUE", "DRAFT"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 min-h-[36px] ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {st === "PAYMENT_PENDING_VERIFICATION"
                    ? "In Verification"
                    : st === "ALL"
                    ? "All"
                    : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Invoices List - Hybrid View */}
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3.5 px-5">Invoice #</th>
                  <th className="py-3.5 px-5">Client</th>
                  <th className="py-3.5 px-5">Issue Date</th>
                  <th className="py-3.5 px-5">Due Date</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                      Loading invoices...
                    </td>
                  </tr>
                ) : !data?.invoices || data.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-foreground font-semibold text-sm">No invoices match your filter</p>
                      <p className="text-muted-foreground text-xs mt-1">Try adjusting your search query or status filter.</p>
                    </td>
                  </tr>
                ) : (
                  data.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-5 font-bold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-medium text-foreground">{inv.receiverName}</div>
                        {inv.receiverEmail && (
                          <div className="text-xs text-muted-foreground">{inv.receiverEmail}</div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-muted-foreground text-xs">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="py-4 px-5 text-muted-foreground text-xs">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-4 px-5 font-bold text-foreground font-mono">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-4 px-5">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.receipts && inv.receipts.length > 0 && inv.status === "PAYMENT_PENDING_VERIFICATION" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setReviewingReceipt({ ...inv.receipts[0], invoice: inv })}
                              className="text-xs h-8 gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/15"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Verify Proof</span>
                            </Button>
                          )}
                          {inv.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: inv.id, status: "PAID" })
                              }
                              className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                              title="Mark as Paid"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={downloadingId === inv.id}
                            onClick={() => handleDownloadPdf(inv)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            render={<Link href={AppRoutes.INVOICE_EDIT(inv.id)} />}
                            nativeButton={false}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Edit Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                deleteMutation.mutate({ id: inv.id });
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-border">
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground text-xs">Loading invoices...</div>
            ) : !data?.invoices || data.invoices.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-foreground text-sm font-semibold">No invoices found</p>
                <p className="text-muted-foreground text-xs">Try adjusting your filters.</p>
              </div>
            ) : (
              data.invoices.map((inv) => (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-foreground block">{inv.invoiceNumber}</span>
                      <span className="text-xs text-muted-foreground">{inv.receiverName}</span>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 border-y border-border/60">
                    <span className="text-muted-foreground">Due: {formatDate(inv.dueDate)}</span>
                    <span className="font-bold text-foreground font-mono text-sm">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {inv.receipts && inv.receipts.length > 0 && inv.status === "PAYMENT_PENDING_VERIFICATION" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewingReceipt({ ...inv.receipts[0], invoice: inv })}
                        className="h-9 text-xs px-2.5 gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/15"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Verify Proof</span>
                      </Button>
                    )}
                    <Button
                      render={<Link href={`/invoices/${inv.id}/edit`} />}
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs flex-1"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> View / Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs"
                      disabled={downloadingId === inv.id}
                      onClick={() => handleDownloadPdf(inv)}
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    {inv.status !== "PAID" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: inv.id, status: "PAID" })
                        }
                        title="Mark Paid"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2.5 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                          deleteMutation.mutate({ id: inv.id });
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Showing page {data.page} of {data.totalPages} ({data.totalCount} total)
              </span>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex-1 sm:flex-initial"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex-1 sm:flex-initial"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Operator Review & Verification Modal */}
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
