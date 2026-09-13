"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, FileCheck, Edit3, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { InvoiceFormProvider, useInvoiceForm } from "~/components/invoice/InvoiceFormContext";
import { InvoiceFormEditor } from "~/components/invoice/InvoiceFormEditor";
import { InvoicePreviewCard } from "~/components/invoice/InvoicePreviewCard";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

function InvoiceCreateContent() {
  const router = useRouter();
  const { invoice, updateField, validateForm } = useInvoiceForm();
  const [isSaving, setIsSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const { data: autoNum } = api.invoice.getNextInvoiceNumber.useQuery();
  const { data: profile } = api.profile.get.useQuery();

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (autoNum && invoice.invoiceNumber === "INV-2026-0001") {
      updateField("invoiceNumber", autoNum);
    }
  }, [autoNum]);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      if (profile.companyName) updateField("senderName", profile.companyName);
      if (profile.email) updateField("senderEmail", profile.email);
      if (profile.phone) updateField("senderPhone", profile.phone);
      if (profile.address) updateField("senderAddress", profile.address);
      if (profile.city) updateField("senderCity", profile.city);
      if (profile.zipCode) updateField("senderZipCode", profile.zipCode);
      if (profile.country) updateField("senderCountry", profile.country);
      if (profile.taxId) updateField("senderTaxId", profile.taxId);
      if (profile.currency) updateField("currency", profile.currency);
      if (profile.paymentTerms) updateField("paymentTerms", profile.paymentTerms);
      if (profile.notes) updateField("notes", profile.notes);
      if ((profile as any).bankName) updateField("bankName", (profile as any).bankName);
      if ((profile as any).bankAccountName) updateField("bankAccountName", (profile as any).bankAccountName);
      if ((profile as any).bankAccountNumber) updateField("bankAccountNumber", (profile as any).bankAccountNumber);
      if (profile.logoUrl) updateField("logoUrl", profile.logoUrl);
      if (profile.signatureData) updateField("signatureData", profile.signatureData);
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
    if (status === "PENDING") {
      const isValid = validateForm();
      if (!isValid) {
        setMobileTab("editor");
        return;
      }
    }

    setIsSaving(true);
    createInvoiceMutation.mutate({
      ...invoice,
      status,
    });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/invoices" />}
            nativeButton={false}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">New Invoice</h1>
            <p className="text-xs text-muted-foreground">Draft, customize, and issue billing statement</p>
          </div>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => handleSave("DRAFT")}
            className="gap-1.5"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Draft</span>
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("PENDING")}
            className="gap-1.5 shadow-xs"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            <span>Issue Invoice</span>
          </Button>
        </div>
      </div>

      {/* Mobile Mode Switcher (Tabs) visible only on < 1024px screens */}
      <div className="lg:hidden">
        <Tabs value={mobileTab} onValueChange={(val) => setMobileTab(val as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="editor" className="gap-1.5 text-xs sm:text-sm">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Form</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs sm:text-sm">
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-4">
            <InvoiceFormEditor />
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <InvoicePreviewCard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Grid Layout: Simultaneous Editor & Preview side-by-side on lg+ */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start w-full">
        <div className="lg:col-span-6 xl:col-span-5 2xl:col-span-5">
          <InvoiceFormEditor />
        </div>
        <div className="lg:col-span-6 xl:col-span-7 2xl:col-span-7">
          <InvoicePreviewCard />
        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border p-3 flex items-center justify-between gap-2 shadow-lg">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => handleSave("DRAFT")}
          className="flex-1 text-xs h-11"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>Save Draft</span>
        </Button>
        <Button
          type="button"
          disabled={isSaving}
          onClick={() => handleSave("PENDING")}
          className="flex-1 text-xs h-11 shadow-xs"
        >
          <FileCheck className="w-3.5 h-3.5 mr-1" />
          <span>Issue Invoice</span>
        </Button>
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
