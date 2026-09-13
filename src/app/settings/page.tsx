"use client";

import React, { useState, useEffect } from "react";
import { Building2, Save, Check, FileSignature, Landmark } from "lucide-react";
import { api } from "~/trpc/react";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { LogoUploader } from "~/components/invoice/LogoUploader";
import { SignaturePad } from "~/components/invoice/SignaturePad";

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
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Business Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure your default company sender info, currency, and invoice terms
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100 text-sm font-semibold text-gray-800">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Company & Sender Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Company / Legal Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={profileData.companyName}
                onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tax / VAT ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={profileData.taxId}
                onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Billing Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-gray-100 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Street Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">City</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Postal Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.zipCode}
                  onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Country</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.country}
                  onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-gray-100 text-sm">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400">
              Default Invoicing Terms
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Default Currency</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">Default Payment Terms</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.paymentTerms}
                  onChange={(e) => setProfileData({ ...profileData, paymentTerms: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Default Notes / Memo</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={profileData.notes}
                onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Bank & Payment Information */}
          <div className="space-y-4 pt-2 border-t border-gray-100 text-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Landmark className="w-4 h-4 text-blue-600" />
              <span>Payment & Bank Information</span>
            </div>
            <p className="text-xs text-gray-500">
              Provide your banking details so clients know where to send wire and direct deposit payments. This will be pre-filled on your invoices under Payment Info.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chase, Bank of America"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.bankName}
                  onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Account Name / Beneficiary</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Studio LLC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.bankAccountName}
                  onChange={(e) => setProfileData({ ...profileData, bankAccountName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Account Number / IBAN</label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890 or IBAN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  value={profileData.bankAccountNumber}
                  onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Company Branding & Signature */}
          <div className="space-y-4 pt-2 border-t border-gray-100 text-sm">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400">
              Company Branding & Default Signature
            </h3>
            <p className="text-xs text-gray-500">
              Your default logo and authorized signature will be automatically pre-filled on every newly created invoice.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                <LogoUploader
                  value={profileData.logoUrl}
                  onChange={(logo) => setProfileData({ ...profileData, logoUrl: logo })}
                />
              </div>

              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                <SignaturePad
                  value={profileData.signatureData}
                  onChange={(sig) => setProfileData({ ...profileData, signatureData: sig })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <Check className="w-4 h-4" /> Changes saved successfully!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
