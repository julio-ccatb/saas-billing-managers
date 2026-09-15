"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Receipt, 
  KeyRound, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  FileSignature, 
  AlertTriangle,
  RotateCw,
  ExternalLink,
  DollarSign,
  CheckCircle2,
  Send,
  RefreshCw,
  FileText
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { AppRoutes } from "~/config/routes";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";

export default function CustomerOperationsHubPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Kill-switch guardrail state
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);
  const [killSwitchReason, setKillSwitchReason] = useState("");
  const [killSwitchNotice, setKillSwitchNotice] = useState("");

  // New contract modal state
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractForm, setContractForm] = useState({
    title: "",
    value: 0,
    currency: "USD",
    billingCycle: "MONTHLY" as "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONE_TIME",
    status: "DRAFT" as "DRAFT" | "ACTIVE",
    terms: "",
    notes: "",
  });

  // Terminate contract modal state
  const [terminateContractId, setTerminateContractId] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [syncingContractId, setSyncingContractId] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: customer, isLoading } = api.customer.getById.useQuery(
    { id: customerId },
    { enabled: !!customerId, retry: false }
  );

  // License mutations
  const toggleLicenseMutation = api.license.toggleStatus.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.license.getMetrics.invalidate();
      setKillSwitchModalOpen(false);
      setSelectedLicense(null);
      setKillSwitchReason("");
      setKillSwitchNotice("");
    },
    onError: (err) => {
      alert(`Guardrail error: ${err.message}`);
    },
  });

  // Contract mutations
  const createContractMutation = api.contract.create.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.contract.getMetrics.invalidate();
      setContractModalOpen(false);
      setContractForm({
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

  const terminateContractMutation = api.contract.terminate.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      utils.contract.getMetrics.invalidate();
      setTerminateContractId(null);
      setTerminateReason("");
    },
    onError: (err) => {
      alert(`Error terminating contract: ${err.message}`);
    },
  });

  const [signingModalData, setSigningModalData] = useState<{
    signingUrl: string;
    contractNumber: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [dispatchModalContract, setDispatchModalContract] = useState<any>(null);
  const [customTemplateId, setCustomTemplateId] = useState("");

  const sendForSignatureMutation = api.contract.sendForSignature.useMutation({
    onSuccess: (data) => {
      utils.customer.getById.invalidate({ id: customerId });
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
      utils.customer.getById.invalidate({ id: customerId });
      utils.contract.getMetrics.invalidate();
      utils.invoice.getAll.invalidate();
      setSyncingContractId(null);
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

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openKillSwitchModal = (lic: any) => {
    setSelectedLicense(lic);
    setKillSwitchNotice(
      lic.suspensionNotice ||
        "Your service access is temporarily suspended due to outstanding billing ledger accounts. Please contact operations to resolve."
    );
    setKillSwitchReason("");
    setKillSwitchModalOpen(true);
  };

  const handleConfirmKillSwitch = () => {
    if (!selectedLicense) return;
    const isActivating = selectedLicense.status !== "ACTIVE";
    toggleLicenseMutation.mutate({
      id: selectedLicense.id,
      status: isActivating ? "ACTIVE" : "SUSPENDED",
      suspensionNotice: isActivating ? null : killSwitchNotice,
      reason: isActivating ? "Reactivated by operator" : killSwitchReason,
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
        <Button render={<Link href={AppRoutes.CUSTOMERS} />} nativeButton={false} variant="outline" size="sm">
          Return to Clients
        </Button>
      </div>
    );
  }

  // Calculate client financial summary
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
          nativeButton={false}
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
            nativeButton={false}
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
            <div className="flex items-center gap-3">
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
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Domain Section 1: Contracts Hierarchy */}
      <Card>
        <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-primary" />
              <span>Client Contracts &amp; Subscriptions</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Legally binding commitments, billing intervals, and SLA terms
            </p>
          </div>
          <Button
            onClick={() => setContractModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contract</span>
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Contract #</th>
                <th className="py-3 px-5">Title</th>
                <th className="py-3 px-5">Billing Cycle</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Effective Date</th>
                <th className="py-3 px-5 text-right">Value</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!customer.contracts || customer.contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    No contracts recorded for this client. Create a contract to establish recurring billing.
                  </td>
                </tr>
              ) : (
                customer.contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                      {c.contractNumber}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-foreground text-xs sm:text-sm">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {c.billingCycle}
                    </td>
                    <td className="py-3.5 px-5">
                      {c.status === "DRAFT" ? (
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
                      ) : c.status === "ACTIVE" ? (
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
                      ) : c.status === "TERMINATED" ? (
                        <Badge variant="destructive">Terminated</Badge>
                      ) : (
                        <Badge variant="secondary">{c.status}</Badge>
                      )}
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
      </Card>

      {/* Domain Section 2: Managed Services & Licenses Switchboard */}
      <Card>
        <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Managed Software Licenses &amp; Kill-Switch</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client software leases, heartbeat verification, and remote revocation switchboard
            </p>
          </div>
          <Button
            render={<Link href={AppRoutes.LICENSES} />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <span>All Licenses</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Service</th>
                <th className="py-3 px-5">License Key</th>
                <th className="py-3 px-5">Domain Lock</th>
                <th className="py-3 px-5">Heartbeat</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Switchboard</th>
              </tr>
            </thead>
            <tbody className="divide-y border-border">
              {!customer.licenses || customer.licenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No software licenses provisioned for this customer.
                  </td>
                </tr>
              ) : (
                customer.licenses.map((lic) => {
                  const isActive = lic.status === "ACTIVE";
                  return (
                    <tr key={lic.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-foreground text-xs sm:text-sm">
                        {lic.name}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded font-mono text-xs text-foreground">
                          <span>{lic.key}</span>
                          <button
                            onClick={() => handleCopyKey(lic.key)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy Key"
                          >
                            {copiedKey === lic.key ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                        {lic.allowedDomain || "Any domain"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                        {lic.lastCheckedAt ? formatDate(lic.lastCheckedAt) : "Never verified"}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge variant={isActive ? "success" : "destructive"}>
                          {lic.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant={isActive ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => openKillSwitchModal(lic)}
                          className="text-xs gap-1"
                        >
                          {isActive ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Domain Section 3: Invoices & Billing Ledger */}
      <Card>
        <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Billing Ledger &amp; Invoices</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical statements, issued invoices, and payment tracking
            </p>
          </div>
          <Button
            render={<Link href={AppRoutes.INVOICE_NEW(customer.id)} />}
            nativeButton={false}
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Bill Client</span>
          </Button>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Invoice #</th>
                <th className="py-3 px-5">Issue Date</th>
                <th className="py-3 px-5">Due Date</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!customer.invoices || customer.invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No invoices recorded for this client.
                  </td>
                </tr>
              ) : (
                customer.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <Link
                        href={AppRoutes.INVOICE_DETAILS(inv.id)}
                        className="font-mono text-xs font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          inv.status === "PAID"
                            ? "success"
                            : inv.status === "OVERDUE"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-foreground text-xs sm:text-sm">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* KILL SWITCH GUARDRAIL MODAL */}
      <Dialog open={killSwitchModalOpen} onOpenChange={setKillSwitchModalOpen}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {selectedLicense?.status === "ACTIVE" ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                  <span>Service Disablement Guardrail</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Service Reactivation Guardrail</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {selectedLicense?.status === "ACTIVE" ? (
              <>
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl space-y-1.5 text-xs text-destructive">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Destructive Action Notice
                  </p>
                  <p className="leading-relaxed">
                    Suspending <strong>{selectedLicense?.name}</strong> will cause the client application&apos;s lease
                    renewal to be rejected immediately.
                  </p>
                  {overdueAmount > 0 && (
                    <p className="font-mono pt-1 font-semibold">
                      Past Due Ledger Balance: {formatCurrency(overdueAmount)} ({overdueInvoices.length} invoice(s))
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Operator Rationale (Mandatory for Audit Trail) *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Delinquent account past 30-day grace period"
                    value={killSwitchReason}
                    onChange={(e) => setKillSwitchReason(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Client-Facing Suspension Notice
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="Notice returned to client software upon verification failure"
                    value={killSwitchNotice}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setKillSwitchNotice(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-foreground">Reactivate Client Software Access</p>
                <p className="text-muted-foreground">
                  The client application will receive active authorization upon its next heartbeat check.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setKillSwitchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedLicense?.status === "ACTIVE" ? "destructive" : "default"}
              size="sm"
              disabled={
                selectedLicense?.status === "ACTIVE" && killSwitchReason.trim().length < 3
              }
              onClick={handleConfirmKillSwitch}
            >
              {selectedLicense?.status === "ACTIVE" ? "Enforce Suspension" : "Confirm Reactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE CONTRACT MODAL */}
      <Dialog open={contractModalOpen} onOpenChange={setContractModalOpen}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary" />
              <span>Create Client Contract</span>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createContractMutation.mutate({
                customerId,
                title: contractForm.title,
                value: Number(contractForm.value),
                currency: contractForm.currency,
                billingCycle: contractForm.billingCycle,
                terms: contractForm.terms,
                notes: contractForm.notes,
                status: contractForm.status,
              });
            }}
            className="space-y-4 py-2"
          >
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Contract Title *</label>
              <Input
                required
                placeholder="e.g. Enterprise SaaS Platform License & Support"
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
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
                  value={contractForm.value}
                  onChange={(e) => setContractForm({ ...contractForm, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Billing Cycle</label>
                <select
                  value={contractForm.billingCycle}
                  onChange={(e: any) => setContractForm({ ...contractForm, billingCycle: e.target.value })}
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
                value={contractForm.status}
                onChange={(e: any) => setContractForm({ ...contractForm, status: e.target.value })}
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
                value={contractForm.terms}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContractForm({ ...contractForm, terms: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setContractModalOpen(false)}>
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
              disabled={terminateReason.trim().length < 3 || terminateContractMutation.isPending}
              onClick={() => {
                if (terminateContractId) {
                  terminateContractMutation.mutate({
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
                <p className="text-muted-foreground">Recipient: <strong className="text-foreground">{customer?.name}</strong> ({customer?.email || "No email"})</p>
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
    </div>
  );
}
