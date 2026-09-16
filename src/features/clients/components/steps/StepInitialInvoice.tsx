"use client";

import { Receipt, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { formatCurrency } from "~/lib/utils/format";
import { type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { onboardingInvoiceSchema } from "../../schemas/onboarding.schema";

type OnboardingInvoiceFormValues = z.infer<typeof onboardingInvoiceSchema>;

interface StepInitialInvoiceProps {
  form: UseFormReturn<OnboardingInvoiceFormValues>;
  currency: string;
  contractEnabled: boolean;
  contractValue: number;
  onSyncFromContract: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepInitialInvoice({
  form,
  currency,
  contractEnabled,
  contractValue,
  onSyncFromContract,
  onNext,
  onBack,
}: StepInitialInvoiceProps) {
  const invoice = form.watch();

  return (
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
          onClick={() => form.setValue("enabled", !invoice.enabled)}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)}>
          <CardContent className="p-5 space-y-4">
            {!invoice.enabled ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Initial Invoice step is skipped</p>
                <p>No opening invoice will be generated upon onboarding.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contractEnabled && (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl text-xs">
                    <span className="text-muted-foreground">Pre-filled with Contract Value:</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onSyncFromContract}
                      className="text-primary text-xs gap-1 h-7"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sync {formatCurrency(contractValue)}</span>
                    </Button>
                  </div>
                )}

                <FormField
                  control={form.control}
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
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Invoice Amount ({currency}) *
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
                  control={form.control}
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
              <span>Review &amp; Launch</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
