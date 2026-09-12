import React from "react";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals, formatCurrency, formatDate } from "~/lib/utils/format";

export function CompactTemplate({ invoice }: { invoice: InvoiceInput }) {
  const totals = calculateInvoiceTotals({
    items: invoice.items,
    taxRate: invoice.taxRate,
    discountRate: invoice.discountRate,
    shippingAmount: invoice.shippingAmount,
  });

  const accentColor = invoice.themeColor || "#4F46E5";

  return (
    <div className="p-6 space-y-6 text-gray-800 text-xs font-mono">
      {/* Compact Header */}
      <div className="flex justify-between items-center border-b-2 pb-4" style={{ borderColor: accentColor }}>
        <div>
          <h1 className="text-xl font-black uppercase tracking-widest text-gray-900">
            {invoice.senderName || "BILLING"}
          </h1>
          <p className="text-[10px] text-gray-500">{invoice.senderEmail} | {invoice.senderPhone}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: accentColor }}>INV #{invoice.invoiceNumber}</p>
          <p className="text-[10px] text-gray-400">{formatDate(invoice.issueDate)}</p>
        </div>
      </div>

      {/* Parties Line */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-200 text-[11px]">
        <div>
          <span className="text-gray-400 font-bold block">BILLED TO:</span>
          <span className="font-bold text-gray-900 block">{invoice.receiverName}</span>
          <span className="text-gray-600 block">{invoice.receiverEmail}</span>
          <span className="text-gray-500 block">{invoice.receiverAddress}</span>
        </div>
        <div className="text-right">
          <span className="text-gray-400 font-bold block">STATUS:</span>
          <span className="font-bold uppercase text-gray-900 block">{invoice.status}</span>
          <span className="text-gray-400 font-bold block mt-1">DUE DATE:</span>
          <span className="text-gray-800 block">{formatDate(invoice.dueDate)}</span>
        </div>
      </div>

      {/* Dense Table */}
      <table className="w-full text-left text-[11px] border-collapse">
        <thead>
          <tr className="border-b border-gray-300 uppercase text-gray-500">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-2 font-medium text-gray-900">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
              <td className="py-2 text-right font-bold text-gray-900">
                {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), invoice.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end pt-2 border-t border-gray-200">
        <div className="w-48 space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subTotal, invoice.currency)}</span>
          </div>
          {invoice.discountRate > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount ({invoice.discountRate}%):</span>
              <span>-{formatCurrency(totals.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className="flex justify-between">
              <span>Tax ({invoice.taxRate}%):</span>
              <span>+{formatCurrency(totals.taxAmount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t-2 border-gray-900 font-bold text-xs">
            <span>TOTAL:</span>
            <span style={{ color: accentColor }}>{formatCurrency(totals.totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
