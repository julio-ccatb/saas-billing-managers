"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";

interface Invoice {
  id: string;
  invoiceNumber: string;
  receiverName?: string | null;
  receiverEmail?: string | null;
  dueDate: Date | string | null;
  status: string;
  totalAmount: number;
  currency?: string;
}

interface RecentInvoicesTableProps {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
}

export function RecentInvoicesTable({ invoices, isLoading }: RecentInvoicesTableProps) {
  return (
    <Card className="lg:col-span-2 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base sm:text-lg">Recent Invoices &amp; Ledger</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Latest transactions and status changes</p>
        </div>
        <Button
          render={<Link href={AppRoutes.INVOICES} />}
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-primary hover:text-primary"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-5">Invoice</th>
              <th className="py-3 px-5">Customer</th>
              <th className="py-3 px-5">Due Date</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted-foreground">
                  Loading ledger records...
                </td>
              </tr>
            ) : !invoices || invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  No invoices found. Create your first invoice to populate the ledger.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5">
                    <Link
                      href={AppRoutes.INVOICE_DETAILS(inv.id)}
                      className="font-mono font-medium text-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                        {inv.receiverName || "Unnamed Client"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{inv.receiverEmail}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="py-3.5 px-5">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-semibold text-foreground text-xs sm:text-sm">
                    {formatCurrency(inv.totalAmount, inv.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
