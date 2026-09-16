"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Check,
  Landmark,
} from "lucide-react";
import { api } from "~/trpc/react";
import { LogoUploader } from "~/components/invoice/LogoUploader";
import { SignaturePad } from "~/components/invoice/SignaturePad";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card } from "~/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companyProfileSchema,
  type CompanyProfileValues,
} from "~/lib/schemas/forms";
import { toast } from "~/components/ui/toast";

export function CompanyProfileForm() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const profileForm = useForm<CompanyProfileValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      taxId: "",
      currency: "USD",
      paymentTerms: "Payment due upon receipt",
      notes: "Thank you for your business!",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
    },
  });

  const { data } = api.profile.get.useQuery();

  useEffect(() => {
    if (data) {
      profileForm.reset({
        companyName: data.companyName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        zipCode: data.zipCode ?? "",
        country: data.country ?? "",
        taxId: data.taxId ?? "",
        bankName: (data as any).bankName ?? "",
        bankAccountName: (data as any).bankAccountName ?? "",
        bankAccountNumber: (data as any).bankAccountNumber ?? "",
        currency: data.currency ?? "USD",
        paymentTerms: data.paymentTerms ?? "Payment due upon receipt",
        notes: data.notes ?? "Thank you for your business!",
      });
      setLogoUrl(data.logoUrl ?? null);
      setSignatureData((data as any).signatureData ?? null);
    }
  }, [data, profileForm]);

  const upsertMutation = api.profile.upsert.useMutation({
    onSuccess: () => {
      setSavedSuccess(true);
      toast.success("Settings saved", "Company profile information updated successfully.");
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    onError: (err) => {
      toast.error("Save failed", err.message);
    },
  });

  const handleSubmit = (values: CompanyProfileValues) => {
    upsertMutation.mutate({
      ...values,
      logoUrl,
      signatureData,
    });
  };

  return (
    <Card>
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(handleSubmit)} className="p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-border text-sm font-semibold text-foreground">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Company &amp; Sender Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <FormField
              control={profileForm.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company / Legal Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Tax / VAT ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-border text-sm">
            <FormField
              control={profileForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={profileForm.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border text-sm">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
              Default Invoicing Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <FormControl>
                      <NativeSelect className="w-full" {...field}>
                        <NativeSelectOption value="USD">USD ($)</NativeSelectOption>
                        <NativeSelectOption value="EUR">EUR (€)</NativeSelectOption>
                        <NativeSelectOption value="GBP">GBP (£)</NativeSelectOption>
                        <NativeSelectOption value="CAD">CAD ($)</NativeSelectOption>
                        <NativeSelectOption value="AUD">AUD ($)</NativeSelectOption>
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Payment Terms</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={profileForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Notes / Memo</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Bank & Payment Information */}
          <div className="space-y-4 pt-2 border-t border-border text-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Landmark className="w-4 h-4 text-primary" />
              <span>Payment &amp; Bank Information</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Provide banking details to automatically pre-fill wire/ACH payment instructions on invoices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={profileForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Chase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="bankAccountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Beneficiary</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Studio LLC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="bankAccountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account # / IBAN</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Company Branding & Signature */}
          <div className="space-y-4 pt-2 border-t border-border text-sm">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
              Company Branding &amp; Default Signature
            </h3>
            <p className="text-xs text-muted-foreground">
              Your default logo and authorized signature will be automatically pre-filled on every newly created invoice.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <LogoUploader
                  value={logoUrl}
                  onChange={(logo) => setLogoUrl(logo)}
                />
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border">
                <SignaturePad
                  value={signatureData}
                  onChange={(sig) => setSignatureData(sig)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <Check className="w-4 h-4" /> Changes saved successfully!
              </span>
            ) : (
              <span />
            )}

            <Button
              type="submit"
              disabled={upsertMutation.isPending}
              className="gap-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{upsertMutation.isPending ? "Saving..." : "Save Settings"}</span>
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}
