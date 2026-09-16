"use client";

import Link from "next/link";
import { Receipt, ArrowRight, Check, Upload } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";

interface PortalInvoicesTableProps {
  invoices?: any[];
  onUploadReceipt: (invoice: any) => void;
}

export function PortalInvoicesTable({
  invoices,
  onUploadReceipt,
}: PortalInvoicesTableProps) {
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

      <div className="overflow-x-auto">
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
                      {inv.invoiceNumber}
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
