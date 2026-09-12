export type InvoiceLabelKey =
  | "invoiceNumber"
  | "from"
  | "billTo"
  | "invoiceDate"
  | "dueDate"
  | "item"
  | "qty"
  | "rate"
  | "amount"
  | "subtotal"
  | "discount"
  | "tax"
  | "shipping"
  | "total"
  | "totalInWords"
  | "additionalNotes"
  | "paymentTerms"
  | "signature"
  | "paymentInfoHeading"
  | "bankName"
  | "accountName"
  | "accountNumber"
  | "contactHeading"
  | "logoAlt"
  | "signatureAlt";

export type InvoiceLabels = Record<InvoiceLabelKey, string>;

export const DEFAULT_INVOICE_LABELS: InvoiceLabels = {
  invoiceNumber: "Invoice #",
  from: "From",
  billTo: "Bill to",
  invoiceDate: "Invoice date",
  dueDate: "Due date",
  item: "Item",
  qty: "Qty",
  rate: "Rate",
  amount: "Amount",
  subtotal: "Subtotal",
  discount: "Discount",
  tax: "Tax",
  shipping: "Shipping",
  total: "Total",
  totalInWords: "Total in words",
  additionalNotes: "Additional notes",
  paymentTerms: "Payment terms",
  signature: "Signature",
  paymentInfoHeading: "Please send the payment to this address",
  bankName: "Bank",
  accountName: "Account name",
  accountNumber: "Account no",
  contactHeading: "If you have any questions concerning this invoice, use the following contact information:",
  logoAlt: "Logo of {name}",
  signatureAlt: "Signature of {name}",
};

export type InvoiceTemplateExtras = {
  labels?: InvoiceLabels;
  locale?: string;
  dir?: "ltr" | "rtl";
  theme?: Partial<import("./invoiceTheme").InvoiceTheme>;
};
