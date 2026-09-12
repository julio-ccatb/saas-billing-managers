import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().gt(0, "Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative"),
  total: z.coerce.number().min(0).default(0),
  orderIndex: z.number().default(0),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().nullable().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.coerce.date().default(() => new Date()),
  dueDate: z.coerce.date().default(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  status: z.enum(["DRAFT", "PENDING", "PAID", "OVERDUE"]).default("PENDING"),
  currency: z.string().default("USD"),

  // Sender details
  senderName: z.string().default(""),
  senderEmail: z.string().default(""),
  senderPhone: z.string().default(""),
  senderAddress: z.string().default(""),
  senderCity: z.string().default(""),
  senderZipCode: z.string().default(""),
  senderCountry: z.string().default(""),
  senderTaxId: z.string().default(""),

  // Receiver details
  receiverName: z.string().min(1, "Client name is required"),
  receiverEmail: z.string().default(""),
  receiverPhone: z.string().default(""),
  receiverAddress: z.string().default(""),
  receiverCity: z.string().default(""),
  receiverZipCode: z.string().default(""),
  receiverCountry: z.string().default(""),
  receiverTaxId: z.string().default(""),

  // Line items
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),

  // Totals & adjustments
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountRate: z.coerce.number().min(0).max(100).default(0),
  shippingAmount: z.coerce.number().min(0).default(0),

  notes: z.string().default(""),
  paymentTerms: z.string().default("Payment due upon receipt"),
  templateId: z.string().default("standard"),
});

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").or(z.literal("")).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  zipCode: z.string().default(""),
  country: z.string().default(""),
  taxId: z.string().default(""),
});

export const companyProfileSchema = z.object({
  companyName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  zipCode: z.string().default(""),
  country: z.string().default(""),
  taxId: z.string().default(""),
  logoUrl: z.string().nullable().optional(),
  currency: z.string().default("USD"),
  paymentTerms: z.string().default("Payment due upon receipt"),
  notes: z.string().default("Thank you for your business!"),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
