"use client";

import { KeyRound, ArrowRight, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { onboardingLicenseSchema } from "../../schemas/onboarding.schema";

type OnboardingLicenseFormValues = z.infer<typeof onboardingLicenseSchema>;

interface StepLicenseConfigProps {
  form: UseFormReturn<OnboardingLicenseFormValues>;
  onNext: () => void;
  onBack: () => void;
}

export function StepLicenseConfig({ form, onNext, onBack }: StepLicenseConfigProps) {
  const license = form.watch();

  return (
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
          onClick={() => form.setValue("enabled", !license.enabled)}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)}>
          <CardContent className="p-5 space-y-4">
            {!license.enabled ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">License step is skipped</p>
                <p>This client will not have a provisioned runtime license key.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <FormField
                  control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
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
              <span>Continue to Initial Invoice</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
