"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { AppRoutes } from "~/config/routes";
import { type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { clientProfileSchema } from "../../schemas/onboarding.schema";

type ClientProfileFormValues = z.infer<typeof clientProfileSchema>;

interface StepClientInfoProps {
  form: UseFormReturn<ClientProfileFormValues>;
  onNext: () => void;
}

export function StepClientInfo({ form, onNext }: StepClientInfoProps) {
  return (
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)}>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FormField
                  control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                  control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
  );
}
