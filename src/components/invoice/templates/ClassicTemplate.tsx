import React from "react";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals, formatCurrency, formatDate } from "~/lib/utils/format";

export function ClassicTemplate({ invoice }: { invoice: InvoiceInput }) {
  const totals = calculateInvoiceTotals({
    items: invoice.items,
    taxRate: invoice.taxRate,
    discountRate: invoice.discountRate,
    shippingAmount: invoice.shippingAmount,
  });

  const accentColor = invoice.themeColor || "#4F46E5";

  return (
    <div>
      {/* Top Banner / Color Accent */}
      <div className="h-3.5 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-8 space-y-8 text-gray-800 text-sm">
        {/* Header: Title & Meta */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
              INVOICE
            </h1>
            <p className="text-sm font-semibold text-gray-600 mt-1">#{invoice.invoiceNumber || "DRAFT"}</p>
          </div>
          <div className="text-right space-y-1 text-xs">
            <div>
              <span className="text-gray-400">Date Issued: </span>
              <span className="font-semibold text-gray-700">{formatDate(invoice.issueDate)}</span>
            </div>
            <div>
              <span className="text-gray-400">Due Date: </span>
              <span className="font-semibold text-gray-700">{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="pt-2">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  invoice.status === "PAID"
                    ? "bg-emerald-100 text-emerald-700"
                    : invoice.status === "OVERDUE"
                    ? "bg-rose-100 text-rose-700"
                    : invoice.status === "DRAFT"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Sender & Receiver Info */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: accentColor }}>
              From
            </p>
            <p className="font-bold text-gray-900">{invoice.senderName || "Your Business Name"}</p>
            {invoice.senderEmail && <p className="text-gray-600">{invoice.senderEmail}</p>}
            {invoice.senderPhone && <p className="text-gray-600">{invoice.senderPhone}</p>}
            {invoice.senderAddress && <p className="text-gray-600">{invoice.senderAddress}</p>}
            {(invoice.senderCity || invoice.senderCountry) && (
              <p className="text-gray-600">
                {[invoice.senderCity, invoice.senderZipCode, invoice.senderCountry]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {invoice.senderTaxId && <p className="text-gray-500 text-xs mt-1">Tax ID: {invoice.senderTaxId}</p>}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: accentColor }}>
              Billed To
            </p>
            <p className="font-bold text-gray-900">{invoice.receiverName || "Client Name"}</p>
            {invoice.receiverEmail && <p className="text-gray-600">{invoice.receiverEmail}</p>}
            {invoice.receiverPhone && <p className="text-gray-600">{invoice.receiverPhone}</p>}
            {invoice.receiverAddress && <p className="text-gray-600">{invoice.receiverAddress}</p>}
            {(invoice.receiverCity || invoice.receiverCountry) && (
              <p className="text-gray-600">
                {[invoice.receiverCity, invoice.receiverZipCode, invoice.receiverCountry]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {invoice.receiverTaxId && <p className="text-gray-500 text-xs mt-1">Tax ID: {invoice.receiverTaxId}</p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                <th className="py-3">Description</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Rate</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 text-gray-900 font-medium">{item.description || "Untitled item"}</td>
                  <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                  <td className="py-3 text-right font-semibold text-gray-900">
                    {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
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

            {invoice.shippingAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>+{formatCurrency(invoice.shippingAmount, invoice.currency)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t-2 border-gray-200 font-bold text-gray-900 text-base">
              <span>Total Due</span>
              <span style={{ color: accentColor }}>{formatCurrency(totals.totalAmount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.paymentTerms || invoice.notes) && (
          <div className="pt-6 border-t border-gray-100 text-xs text-gray-500 space-y-2">
            {invoice.paymentTerms && (
              <div>
                <span className="font-semibold text-gray-700">Payment Terms: </span>
                <span>{invoice.paymentTerms}</span>
              </div>
            )}
            {invoice.notes && (
              <div>
                <span className="font-semibold text-gray-700">Notes: </span>
                <span>{invoice.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
