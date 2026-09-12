import React from "react";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals, formatCurrency, formatDate } from "~/lib/utils/format";

export function ModernMinimalTemplate({ invoice }: { invoice: InvoiceInput }) {
  const totals = calculateInvoiceTotals({
    items: invoice.items,
    taxRate: invoice.taxRate,
    discountRate: invoice.discountRate,
    shippingAmount: invoice.shippingAmount,
  });

  const accentColor = invoice.themeColor || "#4F46E5";

  return (
    <div className="p-8 space-y-8 text-gray-800 text-sm">
      {/* Top minimal header */}
      <div className="flex justify-between items-baseline border-b pb-6" style={{ borderColor: `${accentColor}30` }}>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Statement</span>
          <h1 className="text-2xl font-light tracking-tight text-gray-900 mt-0.5">
            Invoice <span className="font-semibold" style={{ color: accentColor }}>#{invoice.invoiceNumber}</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Issued</p>
          <p className="text-sm font-medium text-gray-800">{formatDate(invoice.issueDate)}</p>
          <p className="text-xs text-gray-400 mt-1">Due</p>
          <p className="text-sm font-semibold" style={{ color: accentColor }}>{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-8 text-xs">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Origin</p>
          <p className="text-sm font-bold text-gray-900">{invoice.senderName || "Your Company"}</p>
          <p className="text-gray-500 mt-0.5">{invoice.senderEmail}</p>
          <p className="text-gray-500">{invoice.senderPhone}</p>
          <p className="text-gray-500">{[invoice.senderAddress, invoice.senderCity, invoice.senderCountry].filter(Boolean).join(", ")}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Recipient</p>
          <p className="text-sm font-bold text-gray-900">{invoice.receiverName || "Client Name"}</p>
          <p className="text-gray-500 mt-0.5">{invoice.receiverEmail}</p>
          <p className="text-gray-500">{invoice.receiverPhone}</p>
          <p className="text-gray-500">{[invoice.receiverAddress, invoice.receiverCity, invoice.receiverCountry].filter(Boolean).join(", ")}</p>
        </div>
      </div>

      {/* Items */}
      <div>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-gray-400 uppercase tracking-wider" style={{ borderColor: `${accentColor}25` }}>
              <th className="py-2.5 font-medium">Description</th>
              <th className="py-2.5 text-right font-medium">Qty</th>
              <th className="py-2.5 text-right font-medium">Price</th>
              <th className="py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 font-medium text-gray-800">{item.description}</td>
                <td className="py-3 text-right text-gray-500">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="py-3 text-right font-semibold text-gray-900">
                  {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end pt-4">
        <div className="w-56 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subTotal, invoice.currency)}</span>
          </div>
          {invoice.discountRate > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount ({invoice.discountRate}%)</span>
              <span>-{formatCurrency(totals.discountAmount, invoice.currency)}</span>
            </div>
          )}
          {invoice.taxRate > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>+{formatCurrency(totals.taxAmount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
            <span>Amount Due</span>
            <span style={{ color: accentColor }}>{formatCurrency(totals.totalAmount, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {(invoice.notes || invoice.paymentTerms) && (
        <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-400 space-y-1">
          {invoice.paymentTerms && <p><span className="font-semibold text-gray-600">Terms:</span> {invoice.paymentTerms}</p>}
          {invoice.notes && <p><span className="font-semibold text-gray-600">Notes:</span> {invoice.notes}</p>}
        </div>
      )}
    </div>
  );
}
