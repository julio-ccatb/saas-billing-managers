"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Receipt, ArrowRight, Check, Upload, Eye, Download } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";

interface PortalInvoicesTableProps {
  invoices?: any[];
  onUploadReceipt: (invoice: any) => void;
  onViewInvoice?: (invoice: any) => void;
}

export function PortalInvoicesTable({
  invoices,
  onUploadReceipt,
  onViewInvoice,
}: PortalInvoicesTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (inv: any) => {
    try {
      setDownloadingId(inv.id);
      const res = await fetch(`/api/invoice/${inv.id}/pdf?disposition=attachment`);
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
  return (
    <Card className="lg:col-span-7 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-primary" />
          <div>
            <CardTitle className="text-base font-bold">Recent Invoices &amp; Receipts</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Submit payment proofs to accelerate verification</p>
          </div>
        </div>
        <Button
          render={<Link href={AppRoutes.PORTAL_INVOICES} />}
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-primary hover:text-primary"
        >
          <span>View ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-5">Invoice #</th>
              <th className="py-3 px-5">Due Date</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Amount</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!invoices || invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                  No invoices on record for this account.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const isPaid = inv.status === "PAID";
                const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";

                return (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                      {onViewInvoice ? (
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          className="text-primary hover:underline flex items-center gap-1.5 font-bold cursor-pointer"
                          title="Click to view Invoice PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{inv.invoiceNumber}</span>
                        </button>
                      ) : (
                        inv.invoiceNumber
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-5">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onViewInvoice!(inv)}
                          className="text-xs h-7 px-2.5 gap-1.5 cursor-pointer font-medium shadow-xs"
                          title="View Invoice PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View PDF</span>
                        </Button>
                        {/* {onViewInvoice && (
                        )} */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingId === inv.id}
                          onClick={() => handleDownload(inv)}
                          className="text-xs h-7 px-2 gap-1 cursor-pointer"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>
                            {downloadingId === inv.id ? "..." : "Download"}
                          </span>
                        </Button>
                        {isPaid ? (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : isVerification ? (
                          <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                            Reviewing
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUploadReceipt(inv)}
                            className="text-xs h-7 gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Receipt</span>
                          </Button>
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

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-border">
        {!invoices || invoices.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No invoices on record for this account.
          </div>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === "PAID";
            const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";

            return (
              <div key={inv.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  {onViewInvoice ? (
                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      className="font-mono font-bold text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{inv.invoiceNumber}</span>
                    </button>
                  ) : (
                    <span className="font-mono font-bold text-sm text-foreground">{inv.invoiceNumber}</span>
                  )}
                  <InvoiceStatusBadge status={inv.status} />
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-y border-border/50">
                  <span className="text-muted-foreground">Due: {formatDate(inv.dueDate)}</span>
                  <span className="font-bold text-foreground font-mono text-sm">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onViewInvoice && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onViewInvoice(inv)}
                      className="flex-1 text-xs h-8 gap-1.5 cursor-pointer font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View PDF</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={downloadingId === inv.id}
                    onClick={() => handleDownload(inv)}
                    className="text-xs h-8 px-2.5 gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{downloadingId === inv.id ? "..." : "Download"}</span>
                  </Button>

                  {!isPaid && !isVerification && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUploadReceipt(inv)}
                      className="w-full text-xs h-8 gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Receipt</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
