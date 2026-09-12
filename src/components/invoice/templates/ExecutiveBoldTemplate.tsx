import React from "react";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals, formatCurrency, formatDate } from "~/lib/utils/format";

export function ExecutiveBoldTemplate({ invoice }: { invoice: InvoiceInput }) {
  const totals = calculateInvoiceTotals({
    items: invoice.items,
    taxRate: invoice.taxRate,
    discountRate: invoice.discountRate,
    shippingAmount: invoice.shippingAmount,
  });

  const accentColor = invoice.themeColor || "#4F46E5";

  return (
    <div>
      {/* Full-bleed solid header band */}
      <div className="p-8 text-white" style={{ backgroundColor: accentColor }}>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs uppercase font-semibold tracking-widest text-white/80">Corporate Billing</span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">{invoice.senderName || "Your Company"}</h1>
            <p className="text-xs text-white/80 mt-1">{invoice.senderEmail} • {invoice.senderPhone}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-xs font-bold uppercase tracking-wider">
              {invoice.status}
            </span>
            <p className="text-xl font-bold tracking-tight mt-2">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 text-gray-800 text-sm">
        {/* Parties and Meta */}
        <div className="grid grid-cols-2 gap-8 pb-6 border-b border-gray-100">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">Invoice For</p>
            <p className="font-bold text-base text-gray-900">{invoice.receiverName || "Client Name"}</p>
            <p className="text-gray-600 text-xs mt-0.5">{invoice.receiverEmail}</p>
            <p className="text-gray-600 text-xs">{[invoice.receiverAddress, invoice.receiverCity, invoice.receiverCountry].filter(Boolean).join(", ")}</p>
            {invoice.receiverTaxId && <p className="text-gray-500 text-xs mt-1">Tax ID: {invoice.receiverTaxId}</p>}
          </div>

          <div className="text-right space-y-1 text-xs">
            <p><span className="text-gray-400">Issue Date:</span> <span className="font-semibold text-gray-800">{formatDate(invoice.issueDate)}</span></p>
            <p><span className="text-gray-400">Due Date:</span> <span className="font-bold text-gray-900">{formatDate(invoice.dueDate)}</span></p>
            <p><span className="text-gray-400">Terms:</span> <span className="text-gray-700">{invoice.paymentTerms}</span></p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100/70 text-xs uppercase tracking-wider text-gray-600 font-bold">
              <th className="py-2.5 px-3 rounded-l-md">Item</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right rounded-r-md">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 px-3 font-semibold text-gray-900">{item.description}</td>
                <td className="py-3 px-3 text-right text-gray-600">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-gray-600">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                <td className="py-3 px-3 text-right font-bold text-gray-900">
                  {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
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
              <div className="flex justify-between text-gray-600">
                <span>Tax ({invoice.taxRate}%)</span>
                <span>+{formatCurrency(totals.taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div
              className="flex justify-between p-3 rounded-lg text-white font-bold text-sm mt-3"
              style={{ backgroundColor: accentColor }}
            >
              <span>Total Balance</span>
              <span>{formatCurrency(totals.totalAmount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
            <p className="font-semibold text-gray-700">Remarks:</p>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
