"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  ArrowRight, 
  Check, 
  Upload, 
  Eye, 
  Download, 
  FileText,
  FileCheck 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "~/components/ui/table";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "~/components/ui/empty";
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

  const hasInvoices = invoices && invoices.length > 0;

  return (
    <Card className="lg:col-span-7 overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-row items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">Recent Invoices &amp; Receipts</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Submit payment proofs to accelerate verification</p>
          </div>
        </div>
        <Button
          render={<Link href={AppRoutes.PORTAL_INVOICES} />}
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10 font-medium"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      {!hasInvoices ? (
        <div className="p-8">
          <Empty className="py-6">
            <EmptyMedia variant="icon">
              <Receipt className="w-4 h-4 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No Invoices on Record</EmptyTitle>
            <EmptyDescription>
              There are currently no statements or billing invoices recorded for your account.
            </EmptyDescription>
          </Empty>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs font-semibold text-muted-foreground border-border/60">
                  <TableHead className="py-3 px-5">Invoice #</TableHead>
                  <TableHead className="py-3 px-5">Due Date</TableHead>
                  <TableHead className="py-3 px-5">Status</TableHead>
                  <TableHead className="py-3 px-5 text-right">Amount</TableHead>
                  <TableHead className="py-3 px-5 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";

                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-3 px-5 font-mono text-xs font-semibold text-foreground">
                        {onViewInvoice ? (
                          <button
                            type="button"
                            onClick={() => onViewInvoice(inv)}
                            className="text-primary hover:underline flex items-center gap-1.5 font-bold cursor-pointer group"
                            title="Click to view Invoice PDF"
                          >
                            <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            <span>{inv.invoiceNumber}</span>
                          </button>
                        ) : (
                          inv.invoiceNumber
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-5 font-mono text-xs text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="py-3 px-5">
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell className="py-3 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground tabular-nums">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </TableCell>
                      <TableCell className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onViewInvoice && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onViewInvoice(inv)}
                              className="text-xs h-7 px-2.5 gap-1.5 cursor-pointer font-medium shadow-2xs"
                              title="View Invoice PDF"
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
                            className="text-xs h-7 px-2 gap-1 cursor-pointer border-border/80"
                            title="Download Invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>
                              {downloadingId === inv.id ? "..." : "PDF"}
                            </span>
                          </Button>
                          {isPaid ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-1">
                              <Check className="w-3.5 h-3.5" /> Cleared
                            </span>
                          ) : isVerification ? (
                            <Badge variant="verification" className="text-[10px] px-1.5 py-0.5">
                              Under Review
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUploadReceipt(inv)}
                              className="text-xs h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload Proof</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border/60">
            {invoices.map((inv) => {
              const isPaid = inv.status === "PAID";
              const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";

              return (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    {onViewInvoice ? (
                      <button
                        type="button"
                        onClick={() => onViewInvoice(inv)}
                        className="font-mono font-bold text-sm text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{inv.invoiceNumber}</span>
                      </button>
                    ) : (
                      <span className="font-mono font-bold text-sm text-foreground">{inv.invoiceNumber}</span>
                    )}
                    <InvoiceStatusBadge status={inv.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 border-y border-border/50">
                    <span className="text-muted-foreground">Due: {formatDate(inv.dueDate)}</span>
                    <span className="font-bold text-foreground font-mono text-sm tabular-nums">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {onViewInvoice && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onViewInvoice(inv)}
                        className="flex-1 text-xs h-8 gap-1.5 cursor-pointer font-medium shadow-2xs"
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
                      className="text-xs h-8 px-2.5 gap-1.5 cursor-pointer border-border/80"
                    >
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{downloadingId === inv.id ? "..." : "Download"}</span>
                    </Button>

                    {!isPaid && !isVerification && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUploadReceipt(inv)}
                        className="w-full text-xs h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Transfer Receipt</span>
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
  );
}
