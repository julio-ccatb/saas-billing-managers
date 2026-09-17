"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  KeyRound, 
  Plus, 
  FileSignature 
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { AppRoutes } from "~/config/routes";
import { Card, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "~/components/ui/toast";
import { 
  type CreateContractValues, 
  type GuardrailSuspensionValues,
  type CustomerPortalAccessValues,
  type SendSignatureValues 
} from "~/lib/schemas/forms";

import { CustomerContractsSection } from "~/features/clients/components/CustomerContractsSection";
import { CustomerLicensesSection } from "~/features/clients/components/CustomerLicensesSection";
import { CustomerInvoicesSection } from "~/features/clients/components/CustomerInvoicesSection";
import { PortalAccessDialog } from "~/features/clients/components/PortalAccessDialog";
import { CreateContractDialog } from "~/features/contracts/components/CreateContractDialog";
import { TerminateContractDialog } from "~/features/contracts/components/TerminateContractDialog";
import { SendSignatureDialog } from "~/features/contracts/components/SendSignatureDialog";
import { SigningUrlModal } from "~/features/contracts/components/SigningUrlModal";
import { SuspendLicenseDialog } from "~/features/licenses/components/SuspendLicenseDialog";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const utils = api.useUtils();

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [dispatchModalContract, setDispatchModalContract] = useState<any>(null);
  const [terminateContractId, setTerminateContractId] = useState<string | null>(null);
  const [signingModalData, setSigningModalData] = useState<{
    signingUrl: string;
    contractNumber: string;
  } | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [syncingContractId, setSyncingContractId] = useState<string | null>(null);

  const { data: customer, isLoading } = api.customer.getById.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  );

  const toggleLicenseMutation = api.license.toggleStatus.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.license.getMetrics.invalidate();
      setSelectedLicense(null);
      toast.success("License status updated");
    },
    onError: (err) => {
      toast.error("License toggle error", err.message);
    },
  });

  const createContractMutation = api.contract.create.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.contract.getMetrics.invalidate();
      setContractModalOpen(false);
      toast.success("Contract created successfully");
    },
    onError: (err) => {
      toast.error("Contract creation error", err.message);
    },
  });

  const terminateMutation = api.contract.terminate.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.contract.getMetrics.invalidate();
      setTerminateContractId(null);
      toast.success("Contract terminated");
    },
    onError: (err) => {
      toast.error("Contract termination error", err.message);
    },
  });

  const setPortalAccessMutation = api.customer.setPortalAccess.useMutation({
    onSuccess: (data) => {
      utils.customer.getById.invalidate({ id: customerId });
      setPortalModalOpen(false);
      if (data.inviteEmailSent) {
        toast.success("Portal access updated", `Password setup invitation dispatched to ${data.email}.`);
      } else {
        toast.success("Portal access updated");
      }
    },
    onError: (err) => {
      toast.error("Portal access error", err.message);
    },
  });

  const resendInviteMutation = api.customer.resendPortalInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation resent", data.message);
    },
    onError: (err) => {
      toast.error("Resend invitation error", err.message);
    },
  });

  const sendForSignatureMutation = api.contract.sendForSignature.useMutation({
    onSuccess: (data) => {
      utils.customer.getById.invalidate({ id: customerId });
      setDispatchModalContract(null);
      setSigningModalData({
        signingUrl: data.signingUrl,
        contractNumber: data.contractNumber,
      });
      if (data.emailDispatched) {
        toast.success("Signing invitation sent", "Official signing link emailed to client via Resend.");
      } else {
        toast.success("Signing session ready", "Signing URL generated successfully.");
      }
    },
    onError: (err) => {
      toast.error("Contract dispatch failed", err.message);
    },
  });

  const syncDocuSealMutation = api.contract.syncDocuSealStatus.useMutation({
    onSuccess: (data) => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.contract.getMetrics.invalidate();
      utils.invoice.getAll.invalidate();
      setSyncingContractId(null);
      toast.info("DocuSeal sync", data.message);
    },
    onError: (err) => {
      setSyncingContractId(null);
      toast.error("Sync failed", err.message);
    },
  });

  const handleSyncStatus = (contractId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSyncingContractId(contractId);
    syncDocuSealMutation.mutate({ contractId });
  };

  const onConfirmKillSwitch = (values: GuardrailSuspensionValues) => {
    if (!selectedLicense) return;
    const isActivating = selectedLicense.status !== "ACTIVE";
    toggleLicenseMutation.mutate({
      id: selectedLicense.id,
      status: isActivating ? "ACTIVE" : "SUSPENDED",
      suspensionNotice: isActivating ? null : values.suspensionNotice,
      reason: isActivating ? "Reactivated by operator" : values.reason,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading Client Software Operations Profile...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-foreground font-semibold">Client not found or access denied.</p>
        <Button render={<Link href={AppRoutes.CUSTOMERS} />} variant="outline" size="sm">
          Return to Clients
        </Button>
      </div>
    );
  }

  const overdueInvoices = customer.invoices?.filter((inv) => inv.status === "OVERDUE") ?? [];
  const overdueAmount = overdueInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const activeContracts = customer.contracts?.filter((c) => c.status === "ACTIVE") ?? [];
  const totalContractMRR = activeContracts.reduce((acc, c) => {
    if (c.billingCycle === "MONTHLY") return acc + c.value;
    if (c.billingCycle === "ANNUALLY") return acc + c.value / 12;
    if (c.billingCycle === "QUARTERLY") return acc + c.value / 3;
    return acc;
  }, 0);
  const activeLicenses = customer.licenses?.filter((l) => l.status === "ACTIVE") ?? [];
  const suspendedLicenses = customer.licenses?.filter((l) => l.status === "SUSPENDED") ?? [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          render={<Link href={AppRoutes.CUSTOMERS} />}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Client Ledger</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setContractModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <FileSignature className="w-4 h-4" />
            <span>New Contract</span>
          </Button>
          <Button
            render={<Link href={AppRoutes.INVOICE_NEW(customer.id)} />}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
        </div>
      </div>

      {/* Client Overview Card */}
      <Card className="overflow-hidden border-border">
        <CardHeader className="p-6 bg-muted/20 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {customer.name}
                  </h1>
                  {overdueAmount > 0 ? (
                    <Badge variant="destructive" className="font-mono text-xs">
                      Past Due ({formatCurrency(overdueAmount)})
                    </Badge>
                  ) : (
                    <Badge variant="success" className="font-mono text-xs">
                      Account in Good Standing
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {customer.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {customer.email}
                    </span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                      {customer.phone}
                    </span>
                  )}
                  {customer.taxId && (
                    <span className="font-mono bg-muted/60 px-1.5 py-0.5 rounded text-[11px]">
                      Tax ID: {customer.taxId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Badge Group */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contract MRR</p>
                <p className="text-lg font-bold text-foreground font-mono">{formatCurrency(totalContractMRR)}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Services</p>
                <p className="text-lg font-bold text-foreground font-mono">
                  {activeLicenses.length}
                  {suspendedLicenses.length > 0 && (
                    <span className="text-destructive text-xs ml-1 font-normal">
                      ({suspendedLicenses.length} suspended)
                    </span>
                  )}
                </p>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPortalModalOpen(true)}
                  className="gap-1.5 text-xs h-9"
                >
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {customer.portalEnabled ? "Portal: Active" : "Enable Portal Access"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Domain Sections */}
      <CustomerContractsSection
        contracts={customer.contracts}
        onAddContract={() => setContractModalOpen(true)}
        onDispatchSign={(c) => setDispatchModalContract(c)}
        onSyncStatus={handleSyncStatus}
        onTerminate={(id) => setTerminateContractId(id)}
        syncingContractId={syncingContractId}
      />

      <CustomerLicensesSection
        licenses={customer.licenses}
        onOpenKillSwitch={(lic) => setSelectedLicense(lic)}
      />

      <CustomerInvoicesSection
        invoices={customer.invoices}
        customerId={customer.id}
      />

      {/* Reusable Extracted Dialogs */}
      <PortalAccessDialog
        customer={customer}
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        onSubmit={(values: CustomerPortalAccessValues) => setPortalAccessMutation.mutate({ customerId, ...values })}
        isPending={setPortalAccessMutation.isPending}
        onResendInvite={() => resendInviteMutation.mutate({ customerId })}
        isResending={resendInviteMutation.isPending}
      />

      <CreateContractDialog
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        onSubmit={(values: CreateContractValues) => createContractMutation.mutate(values)}
        isPending={createContractMutation.isPending}
        defaultCustomerId={customer.id}
        customers={[{ id: customer.id, name: customer.name }]}
      />

      <TerminateContractDialog
        contractId={terminateContractId}
        isOpen={!!terminateContractId}
        onClose={() => setTerminateContractId(null)}
        onTerminate={(id, reason) => terminateMutation.mutate({ id, reason })}
        isPending={terminateMutation.isPending}
      />

      <SendSignatureDialog
        contract={dispatchModalContract}
        onClose={() => setDispatchModalContract(null)}
        onSubmit={(values: SendSignatureValues) => {
          if (dispatchModalContract) {
            sendForSignatureMutation.mutate({
              contractId: dispatchModalContract.id,
              templateId: values.templateId?.trim() || undefined,
            });
          }
        }}
        isPending={sendForSignatureMutation.isPending}
      />

      <SigningUrlModal
        data={signingModalData}
        onClose={() => setSigningModalData(null)}
      />

      <SuspendLicenseDialog
        license={selectedLicense}
        onClose={() => setSelectedLicense(null)}
        onSuspend={onConfirmKillSwitch}
        isPending={toggleLicenseMutation.isPending}
      />
    </div>
  );
}
