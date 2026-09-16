"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  FileSignature, 
  KeyRound, 
  Receipt, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Rocket, 
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect } from "~/components/ui/native-select";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { AppRoutes } from "~/config/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clientProfileSchema,
  onboardingContractSchema,
  onboardingLicenseSchema,
  onboardingInvoiceSchema,
} from "../schemas/onboarding.schema";
import type { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

type ClientProfileFormValues = z.infer<typeof clientProfileSchema>;
type OnboardingContractFormValues = z.infer<typeof onboardingContractSchema>;
type OnboardingLicenseFormValues = z.infer<typeof onboardingLicenseSchema>;
type OnboardingInvoiceFormValues = z.infer<typeof onboardingInvoiceSchema>;

type Step = "profile" | "contract" | "license" | "invoice" | "review";

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("profile");

  // RHF Forms for each stage
  const profileForm = useForm<ClientProfileFormValues>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      taxId: "",
    },
  });

  const contractForm = useForm<OnboardingContractFormValues>({
    resolver: zodResolver(onboardingContractSchema),
    defaultValues: {
      enabled: true,
      title: "Software Platform Subscription & SLA",
      value: 1200,
      currency: "USD",
      billingCycle: "MONTHLY",
      startDate: new Date(),
      status: "DRAFT",
      terms: "99.9% uptime SLA commitment with priority 4-hour technical support response.",
    },
  });

  const licenseForm = useForm<OnboardingLicenseFormValues>({
    resolver: zodResolver(onboardingLicenseSchema),
    defaultValues: {
      enabled: true,
      name: "Production API License",
      allowedDomain: "",
      leaseTtlMinutes: 60,
      gracePeriodHours: 3,
      suspensionNotice: "Service access suspended due to billing delinquency. Please contact finance to restore.",
    },
  });

  const invoiceForm = useForm<OnboardingInvoiceFormValues>({
    resolver: zodResolver(onboardingInvoiceSchema),
    defaultValues: {
      enabled: true,
      description: "Initial Retainer & Setup Implementation",
      amount: 1200,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: "Payment due within 14 days of issue date.",
    },
  });

  const onboardMutation = api.customer.onboardClient.useMutation({
    onSuccess: (data) => {
      // Direct redirect to the new Client 360° Operations Hub
      router.push(AppRoutes.CUSTOMER_DETAILS(data.customerId));
    },
    onError: (err) => {
      alert(`Onboarding error: ${err.message}`);
    },
  });

  const syncInvoiceFromContract = () => {
    const cValues = contractForm.getValues();
    if (cValues.enabled) {
      invoiceForm.setValue("amount", cValues.value);
      invoiceForm.setValue(
        "description",
        `${cValues.title} (${cValues.billingCycle.toLowerCase()} cycle)`
      );
    }
  };

  const profile = profileForm.watch();
  const contract = contractForm.watch();
  const license = licenseForm.watch();
  const invoice = invoiceForm.watch();

  const stepsList: { id: Step; label: string; icon: React.ElementType; isEnabled?: boolean }[] = [
    { id: "profile", label: "Client Profile", icon: Building2 },
    { id: "contract", label: "Contract & SLA", icon: FileSignature, isEnabled: contract.enabled },
    { id: "license", label: "Service License", icon: KeyRound, isEnabled: license.enabled },
    { id: "invoice", label: "Initial Invoice", icon: Receipt, isEnabled: invoice.enabled },
    { id: "review", label: "Review & Launch", icon: Rocket },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.id === currentStep);

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={AppRoutes.CUSTOMERS}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Clients</span>
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-xs font-mono text-primary font-semibold">New Client Onboarding</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-1">
            Client Software Onboarding Wizard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure client credentials, legal contracts, runtime licenses, and billing in one seamless flow
          </p>
        </div>
        <Button
          render={<Link href={AppRoutes.CUSTOMERS} />}
          nativeButton={false}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stepsList.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = idx < currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 ${
                isActive
                  ? "border-primary bg-primary/5 text-primary shadow-xs"
                  : isCompleted
                  ? "border-border bg-muted/40 text-foreground"
                  : "border-border/60 text-muted-foreground opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 shrink-0" />
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                {step.isEnabled === false && (
                  <span className="text-[10px] text-muted-foreground font-mono">Skipped</span>
                )}
              </div>
              <span className="font-semibold truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* STAGE 1: Client Profile (Mandatory) */}
      {currentStep === "profile" && (
        <Card className="border-border">
          <CardHeader className="p-5 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Client Entity Details</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Primary organization details, billing address, and tax registration
            </p>
          </CardHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(() => setCurrentStep("contract"))}>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Company / Client Legal Name *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Acme Corporation Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Billing Email Address
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="billing@acmecorp.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Direct Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 019-2834" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="sm:col-span-2">
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Street Address
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="100 Innovation Way, Suite 400" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">City</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Postal / ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="94105" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Country</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">Tax ID / VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="US-XX-XXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>

              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                <Button
                  render={<Link href={AppRoutes.CUSTOMERS} />}
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="gap-1.5">
                  <span>Continue to Contract</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {/* STAGE 2: Contract & SLA (Optional) */}
      {currentStep === "contract" && (
        <Card className="border-border">
          <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
                <span>Contract &amp; SLA Commitment</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define recurring subscription value, billing cycle, and service level agreement
              </p>
            </div>
            <button
              type="button"
              onClick={() => contractForm.setValue("enabled", !contract.enabled)}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground"
            >
              <span>{contract.enabled ? "Enabled" : "Skip Contract"}</span>
              {contract.enabled ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          </CardHeader>

          <Form {...contractForm}>
            <form onSubmit={contractForm.handleSubmit(() => setCurrentStep("license"))}>
              <CardContent className="p-5 space-y-4">
                {!contract.enabled ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Contract step is skipped</p>
                    <p>This client will be onboarded without an active contract agreement.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={contractForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Contract Title *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={contractForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">
                              Contract Value ({contract.currency}) *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={contractForm.control}
                        name="billingCycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">Billing Interval</FormLabel>
                            <FormControl>
                              <NativeSelect {...field}>
                                <option value="MONTHLY">Monthly</option>
                                <option value="QUARTERLY">Quarterly</option>
                                <option value="ANNUALLY">Annually</option>
                                <option value="ONE_TIME">One-Time</option>
                              </NativeSelect>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={contractForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Contract Execution Mode</FormLabel>
                          <FormControl>
                            <NativeSelect {...field}>
                              <option value="DRAFT">Draft — Dispatch for e-Signature via DocuSeal (Recommended)</option>
                              <option value="ACTIVE">Active — Pre-signed or Direct Immediate Activation</option>
                            </NativeSelect>
                          </FormControl>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Draft contracts can be dispatched for digital signature immediately upon client onboarding.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={contractForm.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">SLA &amp; Terms</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>

              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep("profile")}
                  className="gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                >
                  <span>Continue to License</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {/* STAGE 3: Software License (Optional) */}
      {currentStep === "license" && (
        <Card className="border-border">
          <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <span>Software Runtime License Provisioning</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate high-entropy API key, domain binding, and heartbeat lease policies
              </p>
            </div>
            <button
              type="button"
              onClick={() => licenseForm.setValue("enabled", !license.enabled)}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground"
            >
              <span>{license.enabled ? "Enabled" : "Skip License"}</span>
              {license.enabled ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          </CardHeader>

          <Form {...licenseForm}>
            <form
              onSubmit={licenseForm.handleSubmit(() => {
                syncInvoiceFromContract();
                setCurrentStep("invoice");
              })}
            >
              <CardContent className="p-5 space-y-4">
                {!license.enabled ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">License step is skipped</p>
                    <p>This client will not have a provisioned runtime license key.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={licenseForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Service / App Name *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={licenseForm.control}
                        name="allowedDomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">
                              Domain Lock (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="app.clientdomain.com"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={licenseForm.control}
                        name="leaseTtlMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">
                              Lease TTL (Minutes)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="5"
                                max="1440"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={licenseForm.control}
                        name="gracePeriodHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">
                              Grace Period (Hours)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="72"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={licenseForm.control}
                      name="suspensionNotice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Default Suspension Notice
                          </FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>

              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep("contract")}
                  className="gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                >
                  <span>Continue to Initial Invoice</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {/* STAGE 4: Initial Invoice (Optional) */}
      {currentStep === "invoice" && (
        <Card className="border-border">
          <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <span>Initial Invoice / Retainer</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Issue a first bill upon onboarding to immediately activate billing ledger
              </p>
            </div>
            <button
              type="button"
              onClick={() => invoiceForm.setValue("enabled", !invoice.enabled)}
              className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-foreground"
            >
              <span>{invoice.enabled ? "Enabled" : "Skip Invoice"}</span>
              {invoice.enabled ? (
                <ToggleRight className="w-6 h-6 text-primary" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          </CardHeader>

          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(() => setCurrentStep("review"))}>
              <CardContent className="p-5 space-y-4">
                {!invoice.enabled ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Initial Invoice step is skipped</p>
                    <p>No opening invoice will be generated upon onboarding.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contract.enabled && (
                      <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl text-xs">
                        <span className="text-muted-foreground">Pre-filled with Contract Value:</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={syncInvoiceFromContract}
                          className="text-primary text-xs gap-1 h-7"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sync {formatCurrency(contract.value)}</span>
                        </Button>
                      </div>
                    )}

                    <FormField
                      control={invoiceForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">
                            Invoice Item Description *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={invoiceForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">
                              Invoice Amount ({contract.currency}) *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={invoiceForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-foreground">Payment Due Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                                onChange={(e) => {
                                  const d = new Date(e.target.value);
                                  if (!isNaN(d.getTime())) {
                                    field.onChange(d);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={invoiceForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-foreground">Invoice Notes / Terms</FormLabel>
                          <FormControl>
                            <Textarea rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>

              <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep("license")}
                  className="gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="gap-1.5"
                >
                  <span>Review &amp; Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      {/* STAGE 5: Review & Launch */}
      {currentStep === "review" && (
        <Card className="border-border">
          <CardHeader className="p-5 border-b border-border">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              <span>Onboarding Summary &amp; Confirmation</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Review configured client resources before atomic deployment
            </p>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Bento Review Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Profile Overview */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" /> Client Profile
                  </span>
                  <Badge variant="success">Ready</Badge>
                </div>
                <div className="space-y-1 font-mono text-muted-foreground pt-1">
                  <p className="font-bold text-foreground text-sm">{profile.name}</p>
                  <p>{profile.email || "No email"}</p>
                  <p>{profile.phone || "No phone"}</p>
                  {profile.taxId && <p>Tax ID: {profile.taxId}</p>}
                </div>
              </div>

              {/* Contract Overview */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-primary" /> Contract
                  </span>
                  {contract.enabled ? (
                    <Badge variant="success">Included</Badge>
                  ) : (
                    <Badge variant="secondary">Skipped</Badge>
                  )}
                </div>
                {contract.enabled ? (
                  <div className="space-y-1 font-mono text-muted-foreground pt-1">
                    <p className="font-bold text-foreground text-sm">
                      {formatCurrency(contract.value, contract.currency)}{" "}
                      <span className="text-xs font-normal">/ {contract.billingCycle.toLowerCase()}</span>
                    </p>
                    <p className="truncate">{contract.title}</p>
                    <p>Starts: {contract.startDate.toISOString().split("T")[0]}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground pt-1">No contract will be created.</p>
                )}
              </div>

              {/* License Overview */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-primary" /> Runtime License
                  </span>
                  {license.enabled ? (
                    <Badge variant="success">Provisioning</Badge>
                  ) : (
                    <Badge variant="secondary">Skipped</Badge>
                  )}
                </div>
                {license.enabled ? (
                  <div className="space-y-1 font-mono text-muted-foreground pt-1">
                    <p className="font-bold text-foreground">{license.name}</p>
                    <p>Domain: {license.allowedDomain || "Unrestricted"}</p>
                    <p>Lease: {license.leaseTtlMinutes}m (Grace: {license.gracePeriodHours}h)</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground pt-1">No license key will be generated.</p>
                )}
              </div>

              {/* Invoice Overview */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-primary" /> Initial Bill
                  </span>
                  {invoice.enabled ? (
                    <Badge variant="success">Included</Badge>
                  ) : (
                    <Badge variant="secondary">Skipped</Badge>
                  )}
                </div>
                {invoice.enabled ? (
                  <div className="space-y-1 font-mono text-muted-foreground pt-1">
                    <p className="font-bold text-foreground text-sm">
                      {formatCurrency(invoice.amount, contract.currency)}
                    </p>
                    <p className="truncate">{invoice.description}</p>
                    <p>Due: {invoice.dueDate.toISOString().split("T")[0]}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground pt-1">No initial invoice will be generated.</p>
                )}
              </div>
            </div>

            {/* Audit Notice */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5 text-xs text-primary">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Clicking <strong>Launch Client Operations</strong> will atomically commit all configured records and log an immutable record to the Audit Ledger. You will be redirected immediately to the client&apos;s new 360° Operations Hub.
              </p>
            </div>
          </CardContent>

          <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep("invoice")}
              className="gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              size="sm"
              disabled={onboardMutation.isPending}
              onClick={() => {
                onboardMutation.mutate({
                  profile,
                  contract,
                  license,
                  invoice,
                });
              }}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm"
            >
              <Rocket className="w-4 h-4" />
              <span>{onboardMutation.isPending ? "Deploying Client..." : "Launch Client Operations"}</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
