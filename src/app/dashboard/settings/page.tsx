"use client";

import React, { useState, useEffect } from "react";
import { Building2, Save, Check, Landmark } from "lucide-react";
import { api } from "~/trpc/react";
import { LogoUploader } from "~/components/invoice/LogoUploader";
import { SignaturePad } from "~/components/invoice/SignaturePad";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    taxId: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    logoUrl: null as string | null,
    signatureData: null as string | null,
    currency: "USD",
    paymentTerms: "Payment due upon receipt",
    notes: "Thank you for your business!",
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data, isLoading } = api.profile.get.useQuery();

  useEffect(() => {
    if (data) {
      setProfileData({
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
        logoUrl: data.logoUrl ?? null,
        signatureData: (data as any).signatureData ?? null,
        currency: data.currency ?? "USD",
        paymentTerms: data.paymentTerms ?? "Payment due upon receipt",
        notes: data.notes ?? "Thank you for your business!",
      });
    }
  }, [data]);

  const upsertMutation = api.profile.upsert.useMutation({
    onSuccess: () => {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    onError: (err) => {
      alert(`Failed to save settings: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(profileData);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Business Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Configure default company sender information, currency, payment details, and terms
        </p>
      </div>

      <Card>
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border text-sm font-semibold text-foreground">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Company & Sender Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Company / Legal Name</label>
                <Input
                  type="text"
                  value={profileData.companyName}
                  onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Tax / VAT ID</label>
                <Input
                  type="text"
                  value={profileData.taxId}
                  onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Billing Email</label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Phone</label>
                <Input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-border text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Street Address</label>
                <Input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">City</label>
                  <Input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Postal Code</label>
                  <Input
                    type="text"
                    value={profileData.zipCode}
                    onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Country</label>
                  <Input
                    type="text"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-border text-sm">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Default Invoicing Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Default Currency</label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                    value={profileData.currency}
                    onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Default Payment Terms</label>
                  <Input
                    type="text"
                    value={profileData.paymentTerms}
                    onChange={(e) => setProfileData({ ...profileData, paymentTerms: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Default Notes / Memo</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                  value={profileData.notes}
                  onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Bank & Payment Information */}
            <div className="space-y-4 pt-2 border-t border-border text-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Landmark className="w-4 h-4 text-primary" />
                <span>Payment & Bank Information</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Provide banking details to automatically pre-fill wire/ACH payment instructions on invoices.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Bank Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Chase"
                    value={profileData.bankName}
                    onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Account Beneficiary</label>
                  <Input
                    type="text"
                    placeholder="e.g. Acme Studio LLC"
                    value={profileData.bankAccountName}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Account # / IBAN</label>
                  <Input
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={profileData.bankAccountNumber}
                    onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Company Branding & Signature */}
            <div className="space-y-4 pt-2 border-t border-border text-sm">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Company Branding & Default Signature
              </h3>
              <p className="text-xs text-muted-foreground">
                Your default logo and authorized signature will be automatically pre-filled on every newly created invoice.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="bg-muted/40 p-4 rounded-xl border border-border">
                  <LogoUploader
                    value={profileData.logoUrl}
                    onChange={(logo) => setProfileData({ ...profileData, logoUrl: logo })}
                  />
                </div>

                <div className="bg-muted/40 p-4 rounded-xl border border-border">
                  <SignaturePad
                    value={profileData.signatureData}
                    onChange={(sig) => setProfileData({ ...profileData, signatureData: sig })}
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
        </Card>
      </div>
  );
}
