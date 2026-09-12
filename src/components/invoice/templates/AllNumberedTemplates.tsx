import React from "react";
import type { InvoiceInput } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals, formatCurrency, formatDate } from "~/lib/utils/format";
import { tint, readableOn } from "~/lib/templates/invoiceTemplates";

export type PartCtx = {
  invoice: InvoiceInput;
  totals: ReturnType<typeof calculateInvoiceTotals>;
  accentColor: string;
  onAccent: string;
  softAccent: string;
};

export function createPartCtx(invoice: InvoiceInput): PartCtx {
  const totals = calculateInvoiceTotals({
    items: invoice.items,
    taxRate: invoice.taxRate,
    discountRate: invoice.discountRate,
    shippingAmount: invoice.shippingAmount,
  });
  const accentColor = invoice.themeColor || "#4F46E5";
  const onAccent = readableOn(accentColor);
  const softAccent = tint(accentColor, 0.92);

  return {
    invoice,
    totals,
    accentColor,
    onAccent,
    softAccent,
  };
}

/* ------------------------------------------------------------------ */
/* Template Frame                                                      */
/* ------------------------------------------------------------------ */
export function TemplateFrame({
  ctx,
  children,
  bare = false,
}: {
  ctx: PartCtx;
  children: React.ReactNode;
  bare?: boolean;
}) {
  return (
    <div className="w-full bg-white text-gray-900 min-h-[600px] flex flex-col justify-between font-sans">
      <div className={`flex-1 flex flex-col ${bare ? "" : "p-8 sm:p-12 space-y-7"}`}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Parts (1:1 identical to invoify-fork/parts)                 */
/* ------------------------------------------------------------------ */
export function PartyBlock({
  ctx,
  type,
  align = "left",
}: {
  ctx: PartCtx;
  type: "sender" | "receiver";
  align?: "left" | "right";
}) {
  const { invoice, accentColor } = ctx;
  const isSender = type === "sender";
  const name = isSender ? invoice.senderName : invoice.receiverName;
  const email = isSender ? invoice.senderEmail : invoice.receiverEmail;
  const phone = isSender ? invoice.senderPhone : invoice.receiverPhone;
  const address = isSender ? invoice.senderAddress : invoice.receiverAddress;
  const city = isSender ? invoice.senderCity : invoice.receiverCity;
  const zip = isSender ? invoice.senderZipCode : invoice.receiverZipCode;
  const country = isSender ? invoice.senderCountry : invoice.receiverCountry;
  const taxId = isSender ? invoice.senderTaxId : invoice.receiverTaxId;

  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: accentColor }}
      >
        {isSender ? "From" : "Bill To"}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{name || (isSender ? "Your Company" : "Client Name")}</p>
      <div className="mt-1 text-xs not-italic leading-relaxed text-gray-600">
        {address && <p>{address}</p>}
        {(city || zip || country) && <p>{[zip, city, country].filter(Boolean).join(", ")}</p>}
        {email && <p className="mt-0.5">{email}</p>}
        {phone && <p>{phone}</p>}
        {taxId && <p className="text-[11px] text-gray-400 mt-1">Tax ID: {taxId}</p>}
      </div>
    </div>
  );
}

export function DocumentMeta({
  ctx,
  align = "right",
}: {
  ctx: PartCtx;
  align?: "left" | "right";
}) {
  const { invoice } = ctx;
  const rows: [string, string][] = [
    ["Invoice Number", invoice.invoiceNumber || "DRAFT"],
    ["Invoice Date", formatDate(invoice.issueDate)],
    ["Due Date", formatDate(invoice.dueDate)],
  ];

  return (
    <div className={`space-y-1 text-xs ${align === "right" ? "text-right" : "text-left"}`}>
      {rows.map(([label, value]) => (
        <div key={label} className={`flex gap-3 ${align === "right" ? "justify-end" : "justify-start"}`}>
          <span className="font-medium text-gray-500">{label}:</span>
          <span className="tabular-nums font-semibold text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  );
}

export function ItemsTable({
  ctx,
  variant = "rule",
}: {
  ctx: PartCtx;
  variant?: "rule" | "filled" | "plain";
}) {
  const { invoice, accentColor, onAccent } = ctx;
  const headFilled = variant === "filled";

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={headFilled ? { backgroundColor: accentColor } : undefined}>
          {["Item", "Qty", "Rate", "Amount"].map((h, i) => (
            <th
              key={h}
              className={[
                "text-[10px] font-semibold uppercase tracking-wider",
                headFilled ? "px-3 py-2 text-white" : "pb-2",
                i === 0 ? "text-left" : "text-right",
                variant === "rule" ? "border-b-2 border-gray-300" : "",
              ].join(" ")}
              style={headFilled ? { color: onAccent } : { color: accentColor }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {invoice.items.map((item, index) => (
          <tr key={index}>
            <td className={`py-3 ${headFilled ? "px-3" : ""} align-top`}>
              <p className="text-xs font-medium text-gray-900">{item.description || "Line item"}</p>
            </td>
            <td className="py-3 text-xs whitespace-nowrap text-right align-top tabular-nums text-gray-700">
              {item.quantity}
            </td>
            <td className="py-3 text-xs whitespace-nowrap text-right align-top tabular-nums text-gray-700">
              {formatCurrency(item.unitPrice, invoice.currency)}
            </td>
            <td className={`py-3 ${headFilled ? "px-3" : ""} text-xs whitespace-nowrap text-right align-top font-semibold tabular-nums text-gray-900`}>
              {formatCurrency((item.quantity || 0) * (item.unitPrice || 0), invoice.currency)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TotalsBlock({
  ctx,
  emphasis = "rule",
}: {
  ctx: PartCtx;
  emphasis?: "rule" | "fill";
}) {
  const { invoice, totals, accentColor, onAccent } = ctx;

  return (
    <div className="w-full">
      <div className="space-y-1.5 text-xs text-gray-600">
        <div className="flex justify-between gap-6 py-0.5">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(totals.subTotal, invoice.currency)}</span>
        </div>
        {invoice.discountRate > 0 && (
          <div className="flex justify-between gap-6 py-0.5 text-emerald-600">
            <span>Discount ({invoice.discountRate}%)</span>
            <span className="tabular-nums">-{formatCurrency(totals.discountAmount, invoice.currency)}</span>
          </div>
        )}
        {invoice.taxRate > 0 && (
          <div className="flex justify-between gap-6 py-0.5">
            <span>Tax ({invoice.taxRate}%)</span>
            <span className="tabular-nums">+{formatCurrency(totals.taxAmount, invoice.currency)}</span>
          </div>
        )}
        {invoice.shippingAmount > 0 && (
          <div className="flex justify-between gap-6 py-0.5">
            <span>Shipping</span>
            <span className="tabular-nums">+{formatCurrency(invoice.shippingAmount, invoice.currency)}</span>
          </div>
        )}
      </div>

      <div
        className={`mt-2 flex items-baseline justify-between gap-6 ${
          emphasis === "fill" ? "rounded px-3 py-2" : "border-t-2 pt-2"
        }`}
        style={
          emphasis === "fill"
            ? { backgroundColor: accentColor, color: onAccent }
            : { borderColor: accentColor }
        }
      >
        <span className="text-xs font-semibold uppercase tracking-wide">Total Due</span>
        <span className="text-base font-bold tabular-nums">
          {formatCurrency(totals.totalAmount, invoice.currency)}
        </span>
      </div>
    </div>
  );
}

export function NotesBlock({ ctx }: { ctx: PartCtx }) {
  const { invoice } = ctx;
  if (!invoice.notes && !invoice.paymentTerms) return null;

  return (
    <div className="border-t border-gray-100 pt-4 text-xs text-gray-500 space-y-1">
      {invoice.paymentTerms && (
        <p><span className="font-semibold text-gray-700">Payment Terms: </span>{invoice.paymentTerms}</p>
      )}
      {invoice.notes && (
        <p><span className="font-semibold text-gray-700">Notes: </span>{invoice.notes}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* THE 13 EXACT LAYOUTS (1:1 from invoify-fork/layouts/*.tsx)         */
/* ------------------------------------------------------------------ */

// 1. Classic — Logo and sender on left, large "Invoice" on right
export function TemplateClassic({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx}>
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-lg font-semibold" style={{ color: ctx.accentColor }}>
            {invoice.senderName || "Company"}
          </p>
          <p className="text-xs text-gray-500">{invoice.senderEmail}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold uppercase tracking-tight text-gray-900">
            INVOICE
          </div>
          <p className="mt-0.5 text-xs text-gray-500">#{invoice.invoiceNumber}</p>
        </div>
      </header>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <PartyBlock ctx={ctx} type="sender" />
        <PartyBlock ctx={ctx} type="receiver" align="right" />
      </div>

      <div className="mt-7 flex justify-end">
        <DocumentMeta ctx={ctx} />
      </div>

      <div className="mt-7">
        <ItemsTable ctx={ctx} />
      </div>

      <div className="mt-7 flex justify-end">
        <div className="w-full sm:w-1/2">
          <TotalsBlock ctx={ctx} />
        </div>
      </div>

      <NotesBlock ctx={ctx} />
    </TemplateFrame>
  );
}

// 2. Modern — Stacked header with sender above a wide accent rule
export function TemplateModern({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx}>
      <header>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-lg font-semibold text-gray-900">{invoice.senderName || "Company"}</p>
          <div className="text-2xl font-semibold uppercase tracking-tight text-gray-900">
            INVOICE
          </div>
        </div>
        <div
          className="mt-3 h-1 w-full rounded"
          style={{ backgroundColor: ctx.accentColor }}
        />
      </header>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <PartyBlock ctx={ctx} type="sender" />
        <PartyBlock ctx={ctx} type="receiver" align="right" />
      </div>

      <div className="mt-7 flex justify-end">
        <DocumentMeta ctx={ctx} />
      </div>

      <div className="mt-7">
        <ItemsTable ctx={ctx} />
      </div>

      <div className="mt-7 flex justify-end">
        <div className="w-full sm:w-1/2">
          <TotalsBlock ctx={ctx} />
        </div>
      </div>

      <NotesBlock ctx={ctx} />
    </TemplateFrame>
  );
}

// 3. Sidebar — Full-height accent rail carries sender & meta
export function TemplateSidebar({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  const { onAccent, accentColor } = ctx;

  return (
    <TemplateFrame ctx={ctx} bare>
      <div className="flex min-h-full flex-1 flex-col sm:flex-row">
        <aside
          className="w-full shrink-0 p-6 sm:w-[34%] sm:p-7"
          style={{ backgroundColor: accentColor, color: onAccent }}
        >
          <p className="text-lg font-semibold" style={{ color: onAccent }}>
            {invoice.senderName || "Company"}
          </p>
          <div className="mt-1 text-xs not-italic leading-relaxed opacity-85">
            <p>{invoice.senderAddress}</p>
            <p>{[invoice.senderZipCode, invoice.senderCity].filter(Boolean).join(", ")}</p>
            <p>{invoice.senderEmail}</p>
            <p>{invoice.senderPhone}</p>
          </div>

          <div className="mt-6 border-t border-white/20 pt-4 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-75">Invoice Number</p>
              <p className="text-xs font-semibold">#{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-75">Invoice Date</p>
              <p className="text-xs">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-75">Due Date</p>
              <p className="text-xs">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col justify-between p-6 sm:p-7 space-y-6">
          <PartyBlock ctx={ctx} type="receiver" />
          <ItemsTable ctx={ctx} />
          <div className="flex justify-end">
            <div className="w-full sm:w-3/5">
              <TotalsBlock ctx={ctx} />
            </div>
          </div>
          <NotesBlock ctx={ctx} />
        </main>
      </div>
    </TemplateFrame>
  );
}

// 4. BoldHeader — Full-bleed saturated color band across top
export function TemplateBoldHeader({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx} bare>
      <header
        className="px-6 py-8 sm:px-12 sm:py-10"
        style={{ backgroundColor: ctx.accentColor, color: ctx.onAccent }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold" style={{ color: ctx.onAccent }}>
              {invoice.senderName || "Company"}
            </p>
            <p className="text-xs opacity-85 mt-1">{invoice.senderEmail}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold uppercase tracking-tight" style={{ color: ctx.onAccent }}>
              INVOICE
            </div>
            <p className="text-sm opacity-85 mt-0.5">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </header>

      <div className="p-6 sm:p-12 space-y-7 flex-1">
        <div className="grid gap-6 sm:grid-cols-2">
          <PartyBlock ctx={ctx} type="sender" />
          <PartyBlock ctx={ctx} type="receiver" align="right" />
        </div>
        <div className="flex justify-end">
          <DocumentMeta ctx={ctx} />
        </div>
        <ItemsTable ctx={ctx} variant="filled" />
        <div className="flex justify-end">
          <div className="w-full sm:w-1/2">
            <TotalsBlock ctx={ctx} emphasis="fill" />
          </div>
        </div>
        <NotesBlock ctx={ctx} />
      </div>
    </TemplateFrame>
  );
}

// 5. Minimal — Whitespace, subtle rules, typography does the work
export function TemplateMinimal({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx}>
      <header className="flex items-baseline justify-between gap-6 border-b pb-4 border-gray-200">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Statement</span>
          <h1 className="text-2xl font-light tracking-tight text-gray-900 mt-1">
            Invoice <span className="font-semibold" style={{ color: ctx.accentColor }}>#{invoice.invoiceNumber}</span>
          </h1>
        </div>
        <div className="text-right text-xs">
          <p className="text-gray-400">Date: <span className="text-gray-900 font-medium">{formatDate(invoice.issueDate)}</span></p>
          <p className="text-gray-400">Due: <span className="text-gray-900 font-semibold">{formatDate(invoice.dueDate)}</span></p>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 pt-2">
        <PartyBlock ctx={ctx} type="sender" />
        <PartyBlock ctx={ctx} type="receiver" align="right" />
      </div>

      <ItemsTable ctx={ctx} variant="plain" />

      <div className="flex justify-end">
        <div className="w-full sm:w-1/2">
          <TotalsBlock ctx={ctx} />
        </div>
      </div>

      <NotesBlock ctx={ctx} />
    </TemplateFrame>
  );
}

// 6. Letterhead — Formal centered masthead
export function TemplateLetterhead({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx}>
      <header className="text-center border-b pb-6 border-gray-200">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-900">{invoice.senderName || "COMPANY"}</h1>
        <p className="text-xs text-gray-500 mt-1">{[invoice.senderEmail, invoice.senderAddress, invoice.senderCity].filter(Boolean).join(" • ")}</p>
        <div className="mx-auto mt-3 h-0.5 w-16" style={{ backgroundColor: ctx.accentColor }} />
      </header>

      <div className="flex justify-between items-start">
        <PartyBlock ctx={ctx} type="receiver" />
        <DocumentMeta ctx={ctx} />
      </div>

      <ItemsTable ctx={ctx} />

      <div className="flex justify-end">
        <div className="w-full sm:w-1/2">
          <TotalsBlock ctx={ctx} />
        </div>
      </div>

      <NotesBlock ctx={ctx} />
    </TemplateFrame>
  );
}

// 7. Compact — Receipt-style sheet
export function TemplateCompact({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx}>
      <header className="flex justify-between items-center border-b-2 pb-3" style={{ borderColor: ctx.accentColor }}>
        <div>
          <p className="text-base font-bold uppercase tracking-wider text-gray-900">{invoice.senderName || "COMPANY"}</p>
          <p className="text-xs text-gray-500">{invoice.senderEmail}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: ctx.accentColor }}>#{invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div><span className="text-gray-400 font-semibold uppercase text-[9px]">Bill To:</span><p className="font-bold">{invoice.receiverName}</p></div>
        <div className="text-right"><span className="text-gray-400 font-semibold uppercase text-[9px]">Due Date:</span><p className="font-bold">{formatDate(invoice.dueDate)}</p></div>
      </div>

      <ItemsTable ctx={ctx} />

      <div className="flex justify-end">
        <div className="w-full sm:w-1/2">
          <TotalsBlock ctx={ctx} emphasis="fill" />
        </div>
      </div>

      <NotesBlock ctx={ctx} />
    </TemplateFrame>
  );
}

// 8. TwoTone — Soft tinted bands behind header and totals
export function TemplateTwoTone({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx} bare>
      <header className="p-8 sm:p-12" style={{ backgroundColor: ctx.softAccent }}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-2xl font-bold text-gray-900">{invoice.senderName}</p>
            <p className="text-xs text-gray-600 mt-1">{invoice.senderEmail}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold uppercase tracking-wider" style={{ color: ctx.accentColor }}>
              INVOICE
            </div>
            <p className="text-xs text-gray-600 mt-0.5">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </header>

      <div className="p-8 sm:p-12 space-y-7 flex-1">
        <div className="grid gap-6 sm:grid-cols-2">
          <PartyBlock ctx={ctx} type="sender" />
          <PartyBlock ctx={ctx} type="receiver" align="right" />
        </div>
        <DocumentMeta ctx={ctx} />
        <ItemsTable ctx={ctx} />
      </div>

      <footer className="p-8 sm:p-12" style={{ backgroundColor: ctx.softAccent }}>
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-semibold uppercase text-gray-700">Total Balance</span>
          <span className="text-2xl font-bold" style={{ color: ctx.accentColor }}>
            {formatCurrency(ctx.totals.totalAmount, invoice.currency)}
          </span>
        </div>
      </footer>
    </TemplateFrame>
  );
}

// 9. Bordered — Ruled frame throughout
export function TemplateBordered({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx}>
      <div className="border-2 rounded-xl p-6 sm:p-8 space-y-6" style={{ borderColor: ctx.accentColor }}>
        <header className="flex justify-between items-center border-b pb-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">{invoice.senderName || "OFFICIAL INVOICE"}</h1>
          <p className="font-bold text-base" style={{ color: ctx.accentColor }}>#{invoice.invoiceNumber}</p>
        </header>

        <div className="grid grid-cols-2 gap-6 border-b pb-4">
          <PartyBlock ctx={ctx} type="sender" />
          <PartyBlock ctx={ctx} type="receiver" align="right" />
        </div>

        <DocumentMeta ctx={ctx} />
        <ItemsTable ctx={ctx} />

        <div className="flex justify-end pt-2">
          <div className="w-full sm:w-1/2">
            <TotalsBlock ctx={ctx} emphasis="fill" />
          </div>
        </div>

        <NotesBlock ctx={ctx} />
      </div>
    </TemplateFrame>
  );
}

// 10. LeftRail — Thin accent vertical stripe
export function TemplateLeftRail({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  return (
    <TemplateFrame ctx={ctx} bare>
      <div className="flex min-h-full flex-1">
        <div className="w-3 sm:w-4 shrink-0" style={{ backgroundColor: ctx.accentColor }} />
        <div className="p-8 sm:p-12 space-y-7 flex-1">
          <header className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold text-gray-900">{invoice.senderName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{invoice.senderEmail}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold uppercase tracking-wider" style={{ color: ctx.accentColor }}>
                INVOICE
              </div>
              <p className="text-xs text-gray-500">#{invoice.invoiceNumber}</p>
            </div>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 border-t pt-4">
            <PartyBlock ctx={ctx} type="sender" />
            <PartyBlock ctx={ctx} type="receiver" align="right" />
          </div>

          <DocumentMeta ctx={ctx} />
          <ItemsTable ctx={ctx} />

          <div className="flex justify-end">
            <div className="w-full sm:w-1/2">
              <TotalsBlock ctx={ctx} />
            </div>
          </div>

          <NotesBlock ctx={ctx} />
        </div>
      </div>
    </TemplateFrame>
  );
}

// 11. Statement — Exact 3-column figure summary strip across top
export function TemplateStatement({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);
  const summary = [
    ["Invoice Number", invoice.invoiceNumber || "DRAFT"],
    ["Due Date", formatDate(invoice.dueDate)],
    ["Total Due", formatCurrency(ctx.totals.totalAmount, invoice.currency)],
  ];

  return (
    <TemplateFrame ctx={ctx}>
      <header className="flex items-center justify-between">
        <p className="text-xl font-bold text-gray-900">{invoice.senderName}</p>
        <div className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: ctx.accentColor }}>
          STATEMENT
        </div>
      </header>

      {/* The signature Statement 3-box summary grid */}
      <div
        className="mt-4 grid gap-px overflow-hidden rounded-lg sm:grid-cols-3"
        style={{ backgroundColor: ctx.accentColor }}
      >
        {summary.map(([label, value]) => (
          <div key={label} className="p-4" style={{ backgroundColor: ctx.softAccent }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="text-sm font-bold text-gray-900 mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mt-7">
        <PartyBlock ctx={ctx} type="sender" />
        <PartyBlock ctx={ctx} type="receiver" align="right" />
      </div>

      <ItemsTable ctx={ctx} />

      <div className="flex justify-end">
        <div className="w-full sm:w-1/2">
          <TotalsBlock ctx={ctx} />
        </div>
      </div>

      <NotesBlock ctx={ctx} />
    </TemplateFrame>
  );
}

// 12. Corner — Amount due stamped in the top-right corner
export function TemplateCorner({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);

  return (
    <TemplateFrame ctx={ctx} bare>
      <div className="flex items-start justify-between">
        <div className="p-8 sm:p-12 pb-0 flex-1">
          <p className="text-xl font-bold text-gray-900">{invoice.senderName}</p>
          <div className="mt-4 text-2xl font-light uppercase tracking-[0.2em] text-gray-900">
            INVOICE
          </div>
          <p className="text-xs text-gray-500">#{invoice.invoiceNumber}</p>
        </div>

        {/* Signature stamp corner badge */}
        <div
          className="shrink-0 rounded-bl-3xl px-8 py-7 text-right"
          style={{ backgroundColor: ctx.accentColor, color: ctx.onAccent }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-85">Amount Due</p>
          <p className="text-2xl font-black mt-1 tabular-nums">
            {formatCurrency(ctx.totals.totalAmount, invoice.currency)}
          </p>
          <p className="text-xs mt-1 opacity-85">Due: {formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="p-8 sm:p-12 space-y-7 flex-1">
        <div className="grid gap-6 sm:grid-cols-2">
          <PartyBlock ctx={ctx} type="sender" />
          <PartyBlock ctx={ctx} type="receiver" align="right" />
        </div>

        <DocumentMeta ctx={ctx} />
        <ItemsTable ctx={ctx} />

        <div className="flex justify-end">
          <div className="w-full sm:w-1/2">
            <TotalsBlock ctx={ctx} />
          </div>
        </div>

        <NotesBlock ctx={ctx} />
      </div>
    </TemplateFrame>
  );
}

// 13. Column — Spec-sheet style metadata column beside items
export function TemplateColumn({ invoice }: { invoice: InvoiceInput }) {
  const ctx = createPartCtx(invoice);

  return (
    <TemplateFrame ctx={ctx}>
      <header className="flex justify-between items-center border-b pb-4">
        <p className="text-xl font-bold">{invoice.senderName}</p>
        <p className="text-base font-bold" style={{ color: ctx.accentColor }}>
          INVOICE #{invoice.invoiceNumber}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="sm:col-span-1 border-r border-gray-100 pr-6 space-y-6">
          <PartyBlock ctx={ctx} type="sender" />
          <PartyBlock ctx={ctx} type="receiver" />
          <DocumentMeta ctx={ctx} align="left" />
        </div>

        <div className="sm:col-span-2 space-y-6">
          <ItemsTable ctx={ctx} />
          <div className="flex justify-end">
            <div className="w-full sm:w-4/5">
              <TotalsBlock ctx={ctx} emphasis="fill" />
            </div>
          </div>
          <NotesBlock ctx={ctx} />
        </div>
      </div>
    </TemplateFrame>
  );
}
