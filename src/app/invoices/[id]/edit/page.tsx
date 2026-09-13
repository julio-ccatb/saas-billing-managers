"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { InvoiceFormProvider, useInvoiceForm } from "~/components/invoice/InvoiceFormContext";
import { InvoiceFormEditor } from "~/components/invoice/InvoiceFormEditor";
import { InvoicePreviewCard } from "~/components/invoice/InvoicePreviewCard";
import { api } from "~/trpc/react";

function InvoiceEditContent({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { invoice, setInvoice } = useInvoiceForm();
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    updateInvoiceMutation.mutate({
      ...invoice,
      id: invoiceId,
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-gray-400">Loading invoice details...</div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900">
              Edit Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-gray-500">Update line items, amounts, or terms</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleUpdate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Editor & Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5">
          <InvoiceFormEditor />
        </div>
        <div className="xl:col-span-7">
          <InvoicePreviewCard />
        </div>
      </div>
    </div>
  );
}

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params?.id as string;

  return (
    <DashboardLayout>
      <InvoiceFormProvider>
        <InvoiceEditContent invoiceId={invoiceId} />
      </InvoiceFormProvider>
    </DashboardLayout>
  );
}
