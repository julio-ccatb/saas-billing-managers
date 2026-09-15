import { z } from "zod";

export const clientProfileSchema = z.object({
  name: z.string().min(1, "Company or client name is required"),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  zipCode: z.string().default(""),
  country: z.string().default(""),
  taxId: z.string().default(""),
});

export const onboardingContractSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().default("Software Platform Subscription & SLA"),
  value: z.number().min(0).default(1200),
  currency: z.string().default("USD"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]).default("MONTHLY"),
  startDate: z.date().default(() => new Date()),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
  terms: z.string().default("Standard SLA response time 99.9% uptime commitment."),
});

export const onboardingLicenseSchema = z.object({
  enabled: z.boolean().default(true),
  name: z.string().default("Production API Service Access"),
  allowedDomain: z.string().optional().nullable(),
  leaseTtlMinutes: z.number().min(5).max(1440).default(60),
  gracePeriodHours: z.number().min(1).max(72).default(3),
  suspensionNotice: z.string().default("Service suspended due to billing delinquency."),
});

export const onboardingInvoiceSchema = z.object({
  enabled: z.boolean().default(false),
  description: z.string().default("Initial Setup & First Month Subscription"),
  amount: z.number().min(0).default(1200),
  dueDate: z.date().default(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
  notes: z.string().default("Thank you for your business. Payment due within 14 days."),
});

export const clientOnboardingSchema = z.object({
  profile: clientProfileSchema,
  contract: onboardingContractSchema,
  license: onboardingLicenseSchema,
  invoice: onboardingInvoiceSchema,
});

export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;
