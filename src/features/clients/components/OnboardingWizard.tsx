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
  ArrowLeft, 
  Rocket 
} from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
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

import { StepClientInfo } from "./steps/StepClientInfo";
import { StepContractSetup } from "./steps/StepContractSetup";
import { StepLicenseConfig } from "./steps/StepLicenseConfig";
import { StepInitialInvoice } from "./steps/StepInitialInvoice";
import { StepReview } from "./steps/StepReview";

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

      {/* Step Components */}
      {currentStep === "profile" && (
        <StepClientInfo
          form={profileForm}
          onNext={() => setCurrentStep("contract")}
        />
      )}

      {currentStep === "contract" && (
        <StepContractSetup
          form={contractForm}
          onNext={() => setCurrentStep("license")}
          onBack={() => setCurrentStep("profile")}
        />
      )}

      {currentStep === "license" && (
        <StepLicenseConfig
          form={licenseForm}
          onNext={() => {
            syncInvoiceFromContract();
            setCurrentStep("invoice");
          }}
          onBack={() => setCurrentStep("contract")}
        />
      )}

      {currentStep === "invoice" && (
        <StepInitialInvoice
          form={invoiceForm}
          currency={contract.currency}
          contractEnabled={contract.enabled}
          contractValue={contract.value}
          onSyncFromContract={syncInvoiceFromContract}
          onNext={() => setCurrentStep("review")}
          onBack={() => setCurrentStep("license")}
        />
      )}

      {currentStep === "review" && (
        <StepReview
          profile={profile}
          contract={contract}
          license={license}
          invoice={invoice}
          onBack={() => setCurrentStep("invoice")}
          onLaunch={() => {
            onboardMutation.mutate({
              profile,
              contract,
              license,
              invoice,
            });
          }}
          isPending={onboardMutation.isPending}
        />
      )}
    </div>
  );
}
