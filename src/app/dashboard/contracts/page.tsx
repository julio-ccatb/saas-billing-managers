"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileSignature, 
  Plus, 
  Building2, 
  Send, 
  RefreshCw, 
  FileText 
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { AppRoutes } from "~/config/routes";
import { type CreateContractValues, type SendSignatureValues } from "~/lib/schemas/forms";

import { ContractStatusBadge } from "~/features/contracts/components/ContractStatusBadge";
import { ContractMetricsRow } from "~/features/contracts/components/ContractMetricsRow";
import { ContractFilterBar } from "~/features/contracts/components/ContractFilterBar";
import { TerminateContractDialog } from "~/features/contracts/components/TerminateContractDialog";
import { SigningUrlModal } from "~/features/contracts/components/SigningUrlModal";
import { CreateContractDialog } from "~/features/contracts/components/CreateContractDialog";
import { SendSignatureDialog } from "~/features/contracts/components/SendSignatureDialog";
import { ContractDetailsModal } from "~/features/contracts/components/ContractDetailsModal";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT" | "TERMINATED">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [terminateContractId, setTerminateContractId] = useState<string | null>(null);
  const [selectedContractDetails, setSelectedContractDetails] = useState<any>(null);
  const [signingModalData, setSigningModalData] = useState<{
    signingUrl: string;
    contractNumber: string;
  } | null>(null);
  const [dispatchModalContract, setDispatchModalContract] = useState<any>(null);
  const [syncingContractId, setSyncingContractId] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: metrics, isLoading: loadingMetrics } = api.contract.getMetrics.useQuery();

  const { data: contracts, isLoading: loadingContracts } = api.contract.getAll.useQuery({
    status: statusFilter,
    search: searchTerm,
  });

  const { data: customers } = api.customer.getAll.useQuery();

  const createContractMutation = api.contract.create.useMutation({
    onSuccess: () => {
      utils.contract.getAll.invalidate();
      utils.contract.getMetrics.invalidate();
      setIsCreateOpen(false);
    },
    onError: (err) => {
      alert(`Error creating contract: ${err.message}`);
    },
  });

  const terminateMutation = api.contract.terminate.useMutation({
    onSuccess: () => {
      utils.contract.getAll.invalidate();
      utils.contract.getMetrics.invalidate();
      setTerminateContractId(null);
    },
    onError: (err) => {
      alert(`Error terminating contract: ${err.message}`);
    },
  });

  const sendForSignatureMutation = api.contract.sendForSignature.useMutation({
    onSuccess: (data) => {
      utils.contract.getAll.invalidate();
      setDispatchModalContract(null);
      setSigningModalData({
        signingUrl: data.signingUrl,
        contractNumber: data.contractNumber,
      });
    },
    onError: (err) => {
      alert(`DocuSeal submission failed: ${err.message}`);
    },
  });

  const syncDocuSealMutation = api.contract.syncDocuSealStatus.useMutation({
    onSuccess: (data) => {
      utils.contract.getAll.invalidate();
      utils.contract.getMetrics.invalidate();
      utils.invoice.getAll.invalidate();
      setSyncingContractId(null);
      if (selectedContractDetails && data.contract) {
        setSelectedContractDetails(data.contract);
      }
      alert(data.message);
    },
    onError: (err) => {
      setSyncingContractId(null);
      alert(`Sync failed: ${err.message}`);
    },
  });

  const handleSyncStatus = (contractId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSyncingContractId(contractId);
    syncDocuSealMutation.mutate({ contractId });
  };

  const handleOpenDetails = (contract: any) => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    setSelectedContractDetails(contract);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Contract Lifecycle
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            Client Contracts &amp; Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Immutable agreements, recurring revenue run-rates, and SLA commitments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </Button>
      </div>

      {/* Metrics Bar */}
      <ContractMetricsRow metrics={metrics} isLoading={loadingMetrics} />

      {/* Filter and Search Bar */}
      <ContractFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Contracts Presentation */}
      <Card className="overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Contract #</th>
                <th className="py-3 px-5">Title &amp; Client</th>
                <th className="py-3 px-5">Cycle</th>
                <th className="py-3 px-5">Signature &amp; Status</th>
                <th className="py-3 px-5">Start Date</th>
                <th className="py-3 px-5 text-right">Value</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingContracts ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading contracts...
                  </td>
                </tr>
              ) : !contracts || contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground space-y-2">
                    <FileSignature className="w-8 h-8 mx-auto text-muted-foreground/50" />
                    <p className="text-sm font-semibold">No contracts found</p>
                    <p className="text-xs">Create your first contract to bind client agreements.</p>
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                      <button
                        onClick={() => handleOpenDetails(c)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {c.contractNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => handleOpenDetails(c)}
                        className="font-medium text-foreground text-xs sm:text-sm hover:underline text-left cursor-pointer"
                      >
                        {c.title}
                      </button>
                      <Link
                        href={AppRoutes.CUSTOMER_DETAILS(c.customerId)}
                        className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Building2 className="w-3 h-3" />
                        <span>{c.customer?.name}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {c.billingCycle}
                    </td>
                    <td className="py-3.5 px-5">
                      <ContractStatusBadge
                        status={c.status}
                        signedAt={c.signedAt}
                        submissionId={c.submissionId}
                      />
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {formatDate(c.startDate)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-foreground text-xs sm:text-sm">
                      {formatCurrency(c.value, c.currency)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status === "DRAFT" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDispatchModalContract(c)}
                              className="text-xs h-7 px-2.5 gap-1 text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                            >
                              <Send className="w-3 h-3" />
                              <span>{c.submissionId ? "Re-send" : "Send e-Sign"}</span>
                            </Button>
                            {c.submissionId && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={syncingContractId === c.id}
                                onClick={(e) => handleSyncStatus(c.id, e)}
                                className="text-xs h-7 px-2 gap-1 text-sky-600 border-sky-500/40 hover:bg-sky-500/10"
                                title="Sync status directly from DocuSeal (Zero-tunnel)"
                              >
                                <RefreshCw className={`w-3 h-3 ${syncingContractId === c.id ? "animate-spin" : ""}`} />
                                <span>Sync</span>
                              </Button>
                            )}
                          </>
                        )}
                        {c.status === "ACTIVE" && c.signedDocumentUrl && (
                          <a
                            href={c.signedDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs h-7 px-2 rounded-md border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 transition-colors font-medium"
                            title="View/Download executed agreement PDF"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(c)}
                          className="text-xs h-7 px-2 text-primary"
                        >
                          View
                        </Button>
                        {c.status === "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTerminateContractId(c.id)}
                            className="text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Terminate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (< 768px) */}
        <div className="md:hidden divide-y divide-border">
          {loadingContracts ? (
            <p className="text-center py-10 text-xs text-muted-foreground">Loading contracts...</p>
          ) : !contracts || contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground p-4 space-y-1">
              <FileSignature className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs font-semibold">No contracts found</p>
            </div>
          ) : (
            contracts.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenDetails(c)}
                className="p-4 space-y-2.5 active:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[11px] font-semibold">{c.contractNumber}</span>
                      <span>•</span>
                      <span className="truncate">{c.customer?.name}</span>
                    </div>
                  </div>
                  <ContractStatusBadge
                    status={c.status}
                    signedAt={c.signedAt}
                    submissionId={c.submissionId}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <span className="text-muted-foreground">
                    {c.billingCycle} • Starts {formatDate(c.startDate)}
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {formatCurrency(c.value, c.currency)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Extracted Modals */}
      <ContractDetailsModal
        contract={selectedContractDetails}
        onClose={() => setSelectedContractDetails(null)}
        onDispatchSign={(contract) => {
          setSelectedContractDetails(null);
          setDispatchModalContract(contract);
        }}
        onSyncStatus={handleSyncStatus}
        syncingContractId={syncingContractId}
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

      <CreateContractDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(values: CreateContractValues) => createContractMutation.mutate(values)}
        isPending={createContractMutation.isPending}
        customers={customers}
      />

      <TerminateContractDialog
        contractId={terminateContractId}
        isOpen={!!terminateContractId}
        onClose={() => setTerminateContractId(null)}
        onTerminate={(id, reason) => terminateMutation.mutate({ id, reason })}
        isPending={terminateMutation.isPending}
      />
    </div>
  );
}
