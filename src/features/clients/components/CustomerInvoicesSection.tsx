"use client";

import Link from "next/link";
import { Receipt, Plus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";
import { InvoiceStatusBadge } from "~/features/billing/components/InvoiceStatusBadge";

interface CustomerInvoicesSectionProps {
  invoices?: any[];
  customerId: string;
}

export function CustomerInvoicesSection({
  invoices,
  customerId,
}: CustomerInvoicesSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Billing Ledger &amp; Invoices</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical statements, issued invoices, and payment tracking
          </p>
        </div>
        <Button
          render={<Link href={AppRoutes.INVOICE_NEW(customerId)} />}
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Bill Client</span>
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-5">Invoice #</th>
              <th className="py-3 px-5">Issue Date</th>
              <th className="py-3 px-5">Due Date</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!invoices || invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No invoices recorded for this client.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5">
                    <Link
                      href={AppRoutes.INVOICE_DETAILS(inv.id)}
                      className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {formatDate(inv.issueDate)}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="py-3.5 px-5">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-foreground text-xs sm:text-sm">
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
