import type { InvoiceInput } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals } from "~/lib/utils/format";

export type InvoifyInvoiceType = {
  sender: {
    name: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    customInputs?: { key: string; value: string }[];
  };
  receiver: {
    name: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    customInputs?: { key: string; value: string }[];
  };
  details: {
    theme?: {
      accentColor?: string;
      fontId?: "outfit" | "plexSans" | "sourceSerif" | "plexMono";
      density?: "compact" | "comfortable" | "spacious";
    };
    invoiceLogo?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    purchaseOrderNumber?: string;
    currency: string;
    language?: string;
    items: {
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
    paymentInformation?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
    };
    taxDetails?: {
      amount: number;
      taxID: string;
      amountType: string;
    };
    discountDetails?: {
      amount: number;
      amountType: string;
    };
    shippingDetails?: {
      cost: number;
      costType: string;
    };
    subTotal: number;
    totalAmount: number;
    totalAmountInWords?: string;
    additionalNotes?: string;
    paymentTerms: string;
    signature?: {
      data: string;
      fontFamily?: string;
    };
    pdfTemplate?: number;
  };
};

export function adaptInvoiceToInvoify(invoice: InvoiceInput): InvoifyInvoiceType {
  const totals = calculateInvoiceTotals({
    items: invoice.items,
    taxRate: invoice.taxRate,
    discountRate: invoice.discountRate,
    shippingAmount: invoice.shippingAmount,
  });

  const issueDateStr =
    invoice.issueDate instanceof Date
      ? invoice.issueDate.toISOString().split("T")[0]
      : String(invoice.issueDate || "");
  const dueDateStr =
    invoice.dueDate instanceof Date
      ? invoice.dueDate.toISOString().split("T")[0]
      : String(invoice.dueDate || "");

  const senderCustom: { key: string; value: string }[] = [];
  if (invoice.senderTaxId) {
    senderCustom.push({ key: "Tax ID", value: invoice.senderTaxId });
  }

  const receiverCustom: { key: string; value: string }[] = [];
  if (invoice.receiverTaxId) {
    receiverCustom.push({ key: "Tax ID", value: invoice.receiverTaxId });
  }

  return {
    sender: {
      name: invoice.senderName || "Your Company",
      address: invoice.senderAddress || "",
      zipCode: invoice.senderZipCode || "",
      city: invoice.senderCity || "",
      country: invoice.senderCountry || "",
      email: invoice.senderEmail || "",
      phone: invoice.senderPhone || "",
      customInputs: senderCustom.length ? senderCustom : undefined,
    },
    receiver: {
      name: invoice.receiverName || "Client Name",
      address: invoice.receiverAddress || "",
      zipCode: invoice.receiverZipCode || "",
      city: invoice.receiverCity || "",
      country: invoice.receiverCountry || "",
      email: invoice.receiverEmail || "",
      phone: invoice.receiverPhone || "",
      customInputs: receiverCustom.length ? receiverCustom : undefined,
    },
    details: {
      theme: {
        accentColor: invoice.themeColor || "#4F46E5",
        fontId: "outfit",
        density: "comfortable",
      },
      invoiceNumber: invoice.invoiceNumber || "DRAFT",
      invoiceDate: issueDateStr || "",
      dueDate: dueDateStr || "",
      currency: invoice.currency || "USD",
      items: invoice.items.map((it) => ({
        name: it.description || "Item",
        description: "",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice,
      })),
      taxDetails: invoice.taxRate > 0
        ? {
            amount: invoice.taxRate,
            taxID: invoice.senderTaxId || "",
            amountType: "percentage",
          }
        : undefined,
      discountDetails: invoice.discountRate > 0
        ? {
            amount: invoice.discountRate,
            amountType: "percentage",
          }
        : undefined,
      shippingDetails: invoice.shippingAmount > 0
        ? {
            cost: invoice.shippingAmount,
            costType: "amount",
          }
        : undefined,
      subTotal: totals.subTotal,
      totalAmount: totals.totalAmount,
      additionalNotes: invoice.notes || undefined,
      paymentTerms: invoice.paymentTerms || "",
      invoiceLogo: invoice.logoUrl || undefined,
      signature: invoice.signatureData
        ? {
            data: invoice.signatureData,
            fontFamily: "Dancing Script",
          }
        : undefined,
    },
  };
}
