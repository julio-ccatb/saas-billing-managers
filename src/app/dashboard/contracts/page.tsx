"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileSignature, 
  Plus, 
  Search, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Send,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  FileText
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AppRoutes } from "~/config/routes";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DRAFT" | "TERMINATED">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [terminateContractId, setTerminateContractId] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [selectedContractDetails, setSelectedContractDetails] = useState<any>(null);
  const [signingModalData, setSigningModalData] = useState<{
    signingUrl: string;
    contractNumber: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dispatchModalContract, setDispatchModalContract] = useState<any>(null);
  const [customTemplateId, setCustomTemplateId] = useState("");
  const [syncingContractId, setSyncingContractId] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    value: 0,
    currency: "USD",
    billingCycle: "MONTHLY" as "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONE_TIME",
    status: "DRAFT" as "DRAFT" | "ACTIVE",
    terms: "",
    notes: "",
  });

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
      setForm({
        customerId: "",
        title: "",
        value: 0,
        currency: "USD",
        billingCycle: "MONTHLY",
        status: "DRAFT",
        terms: "",
        notes: "",
      });
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
      setTerminateReason("");
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
      setCopiedLink(false);
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

  const renderContractStatus = (c: any) => {
    if (c.status === "DRAFT") {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 border border-amber-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Awaiting Signature</span>
          </span>
          {c.submissionId ? (
            <span className="text-[10px] font-mono text-muted-foreground">
              DocuSeal #{c.submissionId}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Unsent
            </span>
          )}
        </div>
      );
    }

    if (c.status === "ACTIVE") {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active &amp; Signed</span>
          </span>
          {c.signedAt && (
            <span className="text-[10px] font-mono text-muted-foreground">
              Signed: {formatDate(c.signedAt)}
            </span>
          )}
        </div>
      );
    }

    if (c.status === "TERMINATED") {
      return <Badge variant="destructive">Terminated</Badge>;
    }

    return <Badge variant="secondary">{c.status}</Badge>;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated MRR */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contract MRR
              </p>
              <p className="text-2xl font-bold text-foreground font-mono">
                {loadingMetrics ? "..." : formatCurrency(metrics?.estimatedMRR ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground pt-0.5 font-mono">
                ARR: {formatCurrency((metrics?.estimatedMRR ?? 0) * 12)}
              </p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Active Contracts */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active Contracts
              </p>
              <p className="text-2xl font-bold text-foreground font-mono">
                {loadingMetrics ? "..." : metrics?.activeCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground pt-0.5">
                Total commitments: {metrics?.totalContracts ?? 0}
              </p>
            </div>
            <div className="p-2.5 bg-secondary text-secondary-foreground rounded-xl shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Pipeline Value */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Active Value
              </p>
              <p className="text-2xl font-bold text-foreground font-mono">
                {loadingMetrics ? "..." : formatCurrency(metrics?.totalActiveValue ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground pt-0.5 font-mono">Cumulative contract book</p>
            </div>
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Draft & Terminated */}
        <Card>
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status Breakdown
              </p>
              <p className="text-2xl font-bold text-foreground font-mono">
                {loadingMetrics ? "..." : metrics?.draftCount ?? 0}
                <span className="text-xs font-normal text-muted-foreground ml-1">drafts</span>
              </p>
              <p className="text-xs text-muted-foreground pt-0.5">
                {metrics?.terminatedCount ?? 0} terminated
              </p>
            </div>
            <div className="p-2.5 bg-muted text-muted-foreground rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search contract #, title, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(["ALL", "ACTIVE", "DRAFT", "TERMINATED"] as const).map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="text-xs"
              >
                {st === "ALL" ? "All Contracts" : st}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Contracts Presentation: Desktop Table & Mobile Card Stack */}
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
                      {renderContractStatus(c)}
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
                              onClick={() => {
                                setDispatchModalContract(c);
                                setCustomTemplateId("");
                              }}
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
                            onClick={() => {
                              setTerminateContractId(c.id);
                              setTerminateReason("");
                            }}
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
                  {renderContractStatus(c)}
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

      {/* CONTRACT DETAILS MODAL */}
      <Dialog open={!!selectedContractDetails} onOpenChange={() => setSelectedContractDetails(null)}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              <span>Contract Execution Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedContractDetails && (
            <div className="space-y-4 py-2 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-wider">
                    {selectedContractDetails.contractNumber}
                  </p>
                  <p className="text-base font-bold text-foreground mt-0.5">
                    {selectedContractDetails.title}
                  </p>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {selectedContractDetails.customer?.name}
                  </p>
                </div>
                <div>{renderContractStatus(selectedContractDetails)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border rounded-xl font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase">Value &amp; Interval</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {formatCurrency(selectedContractDetails.value, selectedContractDetails.currency)}{" "}
                    <span className="text-xs font-normal">/ {selectedContractDetails.billingCycle.toLowerCase()}</span>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase">Effective Start</span>
                  <p className="text-foreground mt-0.5">{formatDate(selectedContractDetails.startDate)}</p>
                </div>
                {selectedContractDetails.signedAt && (
                  <div className="col-span-2 pt-1 border-t border-border">
                    <span className="text-muted-foreground text-[10px] uppercase">E-Signed Timestamp</span>
                    <p className="text-emerald-600 font-semibold mt-0.5">
                      {formatDate(selectedContractDetails.signedAt)}
                    </p>
                  </div>
                )}
              </div>

              {selectedContractDetails.signedDocumentUrl && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-700">Executed Agreement PDF</p>
                      <p className="text-[10px] text-muted-foreground">Digitally signed via DocuSeal</p>
                    </div>
                  </div>
                  <a
                    href={selectedContractDetails.signedDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span>View PDF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {selectedContractDetails.terms && (
                <div>
                  <p className="font-semibold text-foreground mb-1">Contract Commitments &amp; SLA Terms:</p>
                  <p className="p-3 bg-card border border-border rounded-lg text-foreground leading-relaxed">
                    {selectedContractDetails.terms}
                  </p>
                </div>
              )}

              <DialogFooter className="pt-2 gap-2 sm:justify-between">
                <div className="flex items-center gap-2">
                  {selectedContractDetails.status === "DRAFT" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const contractToDispatch = selectedContractDetails;
                          setSelectedContractDetails(null);
                          setDispatchModalContract(contractToDispatch);
                          setCustomTemplateId("");
                        }}
                        className="gap-1.5 text-xs text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{selectedContractDetails.submissionId ? "Re-send e-Sign" : "Send for e-Signature"}</span>
                      </Button>
                      {selectedContractDetails.submissionId && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={syncingContractId === selectedContractDetails.id}
                          onClick={(e) => handleSyncStatus(selectedContractDetails.id, e)}
                          className="gap-1.5 text-xs text-sky-600 border-sky-500/40 hover:bg-sky-500/10"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingContractId === selectedContractDetails.id ? "animate-spin" : ""}`} />
                          <span>Sync Status</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedContractDetails(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DISPATCH TO DOCUSEAL MODAL */}
      <Dialog open={!!dispatchModalContract} onOpenChange={() => setDispatchModalContract(null)}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              <span>Send Contract for e-Signature</span>
            </DialogTitle>
          </DialogHeader>

          {dispatchModalContract && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendForSignatureMutation.mutate({
                  contractId: dispatchModalContract.id,
                  templateId: customTemplateId.trim() || undefined,
                });
              }}
              className="space-y-4 py-2 text-xs"
            >
              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="font-mono text-muted-foreground uppercase text-[10px]">Contract</span>
                  <span className="font-mono font-semibold text-foreground">{dispatchModalContract.contractNumber}</span>
                </div>
                <p className="font-bold text-sm text-foreground">{dispatchModalContract.title}</p>
                <p className="text-muted-foreground">Recipient: <strong className="text-foreground">{dispatchModalContract.customer?.name}</strong> ({dispatchModalContract.customer?.email || "No email"})</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  DocuSeal Template ID (Optional)
                </label>
                <Input
                  placeholder="e.g. 12345 or template slug (leave blank for dynamic agreement)"
                  value={customTemplateId}
                  onChange={(e) => setCustomTemplateId(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Enter the ID or slug of your DocuSeal template. If left blank, our dynamic contract document generator will be used.
                </p>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDispatchModalContract(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendForSignatureMutation.isPending}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendForSignatureMutation.isPending ? "Connecting to DocuSeal..." : "Dispatch to DocuSeal"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SIGNING LINK SUCCESS MODAL */}
      <Dialog open={!!signingModalData} onOpenChange={() => setSigningModalData(null)}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>DocuSeal Contract Dispatched!</span>
            </DialogTitle>
          </DialogHeader>

          {signingModalData && (
            <div className="space-y-4 py-2 text-xs">
              <p className="text-muted-foreground">
                The dynamic agreement for contract <strong className="font-mono text-foreground">{signingModalData.contractNumber}</strong> has been generated and pushed to DocuSeal.
              </p>

              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                <span className="text-[10px] font-mono uppercase font-semibold text-muted-foreground">
                  Client Direct Signing Link
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={signingModalData.signingUrl}
                    className="font-mono text-xs bg-background h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 gap-1 shrink-0"
                    onClick={() => {
                      void navigator.clipboard.writeText(signingModalData.signingUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={signingModalData.signingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
                >
                  <span>Open Client Signing View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-center text-[11px] text-muted-foreground">
                  Open this link in a new tab to test signing the document as the client.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE CONTRACT MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              <span>Create New Client Contract</span>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.customerId) {
                alert("Please select a client.");
                return;
              }
              createContractMutation.mutate({
                customerId: form.customerId,
                title: form.title,
                value: Number(form.value),
                currency: form.currency,
                billingCycle: form.billingCycle,
                terms: form.terms,
                notes: form.notes,
                status: form.status,
              });
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Target Client *</label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a client...</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Contract Title *</label>
              <Input
                required
                placeholder="e.g. Platform SaaS Subscription & Technical Support"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Contract Value *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Billing Cycle</label>
                <select
                  value={form.billingCycle}
                  onChange={(e: any) => setForm({ ...form, billingCycle: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUALLY">Annually</option>
                  <option value="ONE_TIME">One-Time</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Contract Execution Mode</label>
              <select
                value={form.status}
                onChange={(e: any) => setForm({ ...form, status: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="DRAFT">Draft — Send for e-Signature via DocuSeal (Recommended)</option>
                <option value="ACTIVE">Active — Pre-signed or Direct Activation</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Draft agreements can be dispatched to DocuSeal and signed digitally by the client.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Terms &amp; Commitments</label>
              <Textarea
                rows={3}
                placeholder="SLA response guarantees, uptime targets, renewal conditions..."
                value={form.terms}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, terms: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createContractMutation.isPending}>
                Create Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TERMINATE CONTRACT MODAL */}
      <Dialog open={!!terminateContractId} onOpenChange={() => setTerminateContractId(null)}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Terminate Contract</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground text-xs">
              Terminated contracts are permanently locked as immutable historical records and will cease contributing to active MRR calculations.
            </p>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Termination Reason (Mandatory) *
              </label>
              <Input
                required
                placeholder="e.g. Mutual termination agreement / Non-payment"
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setTerminateContractId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={terminateReason.trim().length < 3 || terminateMutation.isPending}
              onClick={() => {
                if (terminateContractId) {
                  terminateMutation.mutate({
                    id: terminateContractId,
                    reason: terminateReason,
                  });
                }
              }}
            >
              Terminate Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
