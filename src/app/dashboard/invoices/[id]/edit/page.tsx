"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Edit3, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { InvoiceFormProvider, useInvoiceForm } from "~/components/invoice/InvoiceFormContext";
import { InvoiceFormEditor } from "~/components/invoice/InvoiceFormEditor";
import { InvoicePreviewCard } from "~/components/invoice/InvoicePreviewCard";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { api } from "~/trpc/react";

function InvoiceEditContent({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { invoice, setInvoice, validateForm } = useInvoiceForm();
  const [isSaving, setIsSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const { data, isLoading } = api.invoice.getById.useQuery({ id: invoiceId });

  const dataLoadedRef = React.useRef(false);

  useEffect(() => {
    if (data && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      setInvoice({
        id: data.id,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        status: data.status as any,
        currency: data.currency,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone,
        senderAddress: data.senderAddress,
        senderCity: data.senderCity,
        senderZipCode: data.senderZipCode,
        senderCountry: data.senderCountry,
        senderTaxId: data.senderTaxId,
        receiverName: data.receiverName,
        receiverEmail: data.receiverEmail,
        receiverPhone: data.receiverPhone,
        receiverAddress: data.receiverAddress,
        receiverCity: data.receiverCity,
        receiverZipCode: data.receiverZipCode,
        receiverCountry: data.receiverCountry,
        receiverTaxId: data.receiverTaxId,
        items: data.items.map((it) => ({
          id: it.id,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.total,
          orderIndex: it.orderIndex,
        })),
        taxRate: data.taxRate,
        discountRate: data.discountRate,
        shippingAmount: data.shippingAmount,
        notes: data.notes,
        paymentTerms: data.paymentTerms,
        templateId: data.templateId,
        themeColor: (data as any).themeColor ?? "#4F46E5",
        logoUrl: (data as any).logoUrl ?? null,
        signatureData: (data as any).signatureData ?? null,
        bankName: (data as any).bankName ?? "",
        bankAccountName: (data as any).bankAccountName ?? "",
        bankAccountNumber: (data as any).bankAccountNumber ?? "",
      });
    }
  }, [data]);

  const updateInvoiceMutation = api.invoice.update.useMutation({
    onSuccess: () => {
      router.push("/invoices");
    },
    onError: (err) => {
      alert(`Error updating invoice: ${err.message}`);
      setIsSaving(false);
    },
  });

  const handleUpdate = () => {
    const isValid = validateForm();
    if (!isValid) {
      setMobileTab("editor");
      return;
    }

    setIsSaving(true);
    updateInvoiceMutation.mutate({
      ...invoice,
      id: invoiceId,
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground text-xs">Loading invoice details...</div>
    );
  }

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
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Edit Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-muted-foreground">Update line items, amounts, or terms</p>
          </div>
        </div>

        {/* Desktop Action */}
        <div className="hidden sm:flex items-center gap-2">
          <Button
            type="button"
            disabled={isSaving}
            onClick={handleUpdate}
            className="gap-1.5 shadow-xs"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes</span>
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
          disabled={isSaving}
          onClick={handleUpdate}
          className="w-full text-xs h-11 shadow-xs"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  );
}

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params?.id as string;

  return (
    <InvoiceFormProvider>
      <InvoiceEditContent invoiceId={invoiceId} />
    </InvoiceFormProvider>
  );
}
