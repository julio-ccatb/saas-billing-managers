import { z } from "zod";

export const clientProfileSchema = z.object({
  name: z.string().min(1, "Company or client name is required"),
  email: z.string().email().or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  zipCode: z.string(),
  country: z.string(),
  taxId: z.string(),
});

export const onboardingContractSchema = z.object({
  enabled: z.boolean(),
  title: z.string().min(1, "Contract title is required"),
  value: z.number().min(0),
  currency: z.string().min(1, "Currency is required"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]),
  startDate: z.date(),
  status: z.enum(["DRAFT", "ACTIVE"]),
  terms: z.string(),
});

export const onboardingLicenseSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(1, "License name is required"),
  allowedDomain: z.string().optional().nullable(),
  leaseTtlMinutes: z.number().min(5).max(1440),
  gracePeriodHours: z.number().min(1).max(72),
  suspensionNotice: z.string(),
});

export const onboardingInvoiceSchema = z.object({
  enabled: z.boolean(),
  description: z.string().min(1, "Invoice description is required"),
  amount: z.number().min(0),
  dueDate: z.date(),
  notes: z.string(),
});

export const clientOnboardingSchema = z.object({
  profile: clientProfileSchema,
  contract: onboardingContractSchema,
  license: onboardingLicenseSchema,
  invoice: onboardingInvoiceSchema,
});

export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;
