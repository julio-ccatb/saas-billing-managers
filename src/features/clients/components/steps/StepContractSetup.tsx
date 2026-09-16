"use client";

import { FileSignature, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect } from "~/components/ui/native-select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { onboardingContractSchema } from "../../schemas/onboarding.schema";

type OnboardingContractFormValues = z.infer<typeof onboardingContractSchema>;

interface StepContractSetupProps {
  form: UseFormReturn<OnboardingContractFormValues>;
  onNext: () => void;
  onBack: () => void;
}

export function StepContractSetup({ form, onNext, onBack }: StepContractSetupProps) {
  const contract = form.watch();

  return (
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
          onClick={() => form.setValue("enabled", !contract.enabled)}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)}>
          <CardContent className="p-5 space-y-4">
            {!contract.enabled ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Contract step is skipped</p>
                <p>This client will be onboarded without an active contract agreement.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField
                  control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
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
                  control={form.control}
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
              onClick={onBack}
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
  );
}
