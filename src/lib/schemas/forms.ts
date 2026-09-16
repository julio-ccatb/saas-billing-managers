import { z } from "zod";

// ==========================================
// Authentication Schemas
// ==========================================

export const clientSignInSchema = z.object({
  email: z
    .string()
    .min(1, "Authorized email is required")
    .email("Please enter a valid corporate email"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type ClientSignInValues = z.infer<typeof clientSignInSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Corporate email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// ==========================================
// Customer Schemas
// ==========================================

export const customerUpsertSchema = z.object({
  name: z.string().min(1, "Company or customer name is required").max(120),
  email: z.string().email("Valid email address required").or(z.literal("")).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  taxId: z.string().max(50).optional(),
});

export type CustomerUpsertValues = z.infer<typeof customerUpsertSchema>;

// ==========================================
// Company & Workspace Schemas
// ==========================================

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  currency: z.string().min(1, "Currency is required"),
  taxId: z.string().max(50),
  email: z.string().email("Valid email required").or(z.literal("")),
  phone: z.string().max(40),
  address: z.string().max(255),
  city: z.string().max(100),
  country: z.string().max(100),
});

export type CreateCompanyValues = z.infer<typeof createCompanySchema>;

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, "Legal company name is required"),
  taxId: z.string(),
  email: z.string().email("Valid billing email required").or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  zipCode: z.string(),
  country: z.string(),
  currency: z.string().min(1, "Currency is required"),
  bankName: z.string(),
  bankAccountName: z.string(),
  bankAccountNumber: z.string(),
  paymentTerms: z.string(),
  notes: z.string(),
});

export type CompanyProfileValues = z.infer<typeof companyProfileSchema>;

export const addMemberSchema = z.object({
  email: z.string().min(1, "Email is required").email("Valid corporate email required"),
  role: z.enum(["MEMBER", "ADMIN"]),
});

export type AddMemberValues = z.infer<typeof addMemberSchema>;

// ==========================================
// Contract Schemas
// ==========================================

export const createContractSchema = z.object({
  customerId: z.string().min(1, "Target client is required"),
  title: z.string().min(1, "Contract title is required"),
  value: z.coerce.number().min(0, "Contract value must be 0 or greater"),
  currency: z.string().min(1, "Currency is required"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]),
  terms: z.string(),
  notes: z.string(),
  status: z.enum(["DRAFT", "ACTIVE"]),
});

export type CreateContractValues = z.infer<typeof createContractSchema>;

export const sendSignatureSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  templateId: z.string().optional(),
});

export type SendSignatureValues = z.infer<typeof sendSignatureSchema>;

// ==========================================
// License Schemas
// ==========================================

export const createLicenseSchema = z.object({
  name: z.string().min(1, "Service or project name is required"),
  customerId: z.string().optional(),
  allowedDomain: z.string(),
  suspensionNotice: z.string(),
  leaseTtlMinutes: z.coerce.number().min(5, "Minimum lease TTL is 5 minutes").max(1440),
  gracePeriodHours: z.coerce.number().min(0).max(720),
});

export type CreateLicenseValues = z.infer<typeof createLicenseSchema>;

// ==========================================
// Invoice Modal Schemas
// ==========================================

export const sendInvoiceEmailSchema = z.object({
  recipientEmail: z.string().min(1, "Recipient email is required").email("Valid email required"),
  customMessage: z.string().optional(),
});

export type SendInvoiceEmailValues = z.infer<typeof sendInvoiceEmailSchema>;

export const uploadPaymentReceiptSchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type UploadPaymentReceiptValues = z.infer<typeof uploadPaymentReceiptSchema>;

// ==========================================
// Guardrail Kill Switch Schema
// ==========================================

export const guardrailSuspensionSchema = z.object({
  reason: z.string().min(3, "Mandatory operator rationale must be at least 3 characters"),
  suspensionNotice: z.string(),
});

export type GuardrailSuspensionValues = z.infer<typeof guardrailSuspensionSchema>;

// ==========================================
// Contract Termination & Portal Access Schemas
// ==========================================

export const terminateContractSchema = z.object({
  reason: z.string().min(3, "Termination reason is required (min 3 chars)"),
});

export type TerminateContractValues = z.infer<typeof terminateContractSchema>;

export const customerPortalAccessSchema = z.object({
  email: z.string().min(1, "Client login email is required").email("Valid email required"),
  password: z.string().optional(),
  portalEnabled: z.boolean(),
});

export type CustomerPortalAccessValues = z.infer<typeof customerPortalAccessSchema>;
