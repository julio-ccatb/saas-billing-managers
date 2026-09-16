"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { PortalSummaryCards } from "~/features/portal/components/PortalSummaryCards";
import { PortalInvoicesTable } from "~/features/portal/components/PortalInvoicesTable";
import { PortalLicensesSection } from "~/features/portal/components/PortalLicensesSection";
import { PortalContractsSection } from "~/features/portal/components/PortalContractsSection";
import { UploadReceiptModal } from "~/features/portal/components/UploadReceiptModal";

export default function PortalOverviewPage() {
  const { data: overview, isLoading } = api.portal.getOverview.useQuery();
  const { data: licenses } = api.portal.getLicenses.useQuery();
  const { data: contracts } = api.portal.getContracts.useQuery();

  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground text-xs">
        Loading client portal data...
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Client Welcome & Outstanding Balance Banner */}
      <PortalSummaryCards overview={overview} />

      {/* Grid Section: Invoices & Software Licenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <PortalInvoicesTable
          invoices={overview?.recentInvoices}
          onUploadReceipt={setSelectedInvoiceForReceipt}
        />
        <PortalLicensesSection licenses={licenses} />
      </div>

      {/* Contracts & SLAs Section */}
      <PortalContractsSection contracts={contracts} />

      {/* Upload Receipt Modal */}
      <UploadReceiptModal
        isOpen={!!selectedInvoiceForReceipt}
        onClose={() => setSelectedInvoiceForReceipt(null)}
        invoice={selectedInvoiceForReceipt}
      />
    </div>
  );
}
