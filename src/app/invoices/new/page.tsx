"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileCheck } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { InvoiceFormProvider, useInvoiceForm } from "~/components/invoice/InvoiceFormContext";
import { InvoiceFormEditor } from "~/components/invoice/InvoiceFormEditor";
import { InvoicePreviewCard } from "~/components/invoice/InvoicePreviewCard";
import { api } from "~/trpc/react";

function InvoiceCreateContent() {
  const router = useRouter();
  const { invoice, updateField } = useInvoiceForm();
  const [isSaving, setIsSaving] = useState(false);

  const { data: autoNum } = api.invoice.getNextInvoiceNumber.useQuery();
  const { data: profile } = api.profile.get.useQuery();

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (autoNum && invoice.invoiceNumber === "INV-2026-0001") {
      updateField("invoiceNumber", autoNum);
    }
  }, [autoNum]);

  useEffect(() => {
    if (profile && profile.companyName && !initializedRef.current) {
      initializedRef.current = true;
      updateField("senderName", profile.companyName);
      updateField("senderEmail", profile.email);
      updateField("senderPhone", profile.phone);
      updateField("senderAddress", profile.address);
      updateField("senderCity", profile.city);
      updateField("senderZipCode", profile.zipCode);
      updateField("senderCountry", profile.country);
      updateField("senderTaxId", profile.taxId);
      updateField("currency", profile.currency);
      updateField("paymentTerms", profile.paymentTerms);
      updateField("notes", profile.notes);
    }
  }, [profile]);

  const createInvoiceMutation = api.invoice.create.useMutation({
    onSuccess: () => {
      router.push("/invoices");
    },
    onError: (err) => {
      alert(`Error saving invoice: ${err.message}`);
      setIsSaving(false);
    },
  });

  const handleSave = (status: "DRAFT" | "PENDING") => {
    setIsSaving(true);
    createInvoiceMutation.mutate({
      ...invoice,
      status,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Invoice</h1>
            <p className="text-xs text-gray-500">Draft, customize, and generate invoice</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("DRAFT")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("PENDING")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Editor & Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-7">
          <InvoiceFormEditor />
        </div>
        <div className="xl:col-span-5">
          <InvoicePreviewCard />
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <DashboardLayout>
      <InvoiceFormProvider>
        <InvoiceCreateContent />
      </InvoiceFormProvider>
    </DashboardLayout>
  );
}
