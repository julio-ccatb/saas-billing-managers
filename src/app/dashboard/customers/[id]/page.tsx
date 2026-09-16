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
import { NativeSelect } from "~/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContractSchema,
  guardrailSuspensionSchema,
  terminateContractSchema,
  customerPortalAccessSchema,
  sendSignatureSchema,
  type CreateContractValues,
  type GuardrailSuspensionValues,
  type TerminateContractValues,
  type CustomerPortalAccessValues,
  type SendSignatureValues,
} from "~/lib/schemas/forms";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

export default function CustomerOperationsHubPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Kill-switch guardrail state
  const [killSwitchModalOpen, setKillSwitchModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);

  // Portal Access Modal state
  const [portalModalOpen, setPortalModalOpen] = useState(false);

  // New contract modal state
  const [contractModalOpen, setContractModalOpen] = useState(false);

  // Terminate contract modal state
  const [terminateContractId, setTerminateContractId] = useState<string | null>(null);
  const [syncingContractId, setSyncingContractId] = useState<string | null>(null);

  // DocuSeal dispatch modal state
  const [dispatchModalContract, setDispatchModalContract] = useState<any>(null);
  const [signingModalData, setSigningModalData] = useState<{
    signingUrl: string;
    contractNumber: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // RHF Forms
  const contractRHF = useForm<CreateContractValues>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      customerId: customerId || "",
      title: "",
      value: 0,
      currency: "USD",
      billingCycle: "MONTHLY",
      status: "DRAFT",
      terms: "",
      notes: "",
    },
  });

  const killSwitchRHF = useForm<GuardrailSuspensionValues>({
    resolver: zodResolver(guardrailSuspensionSchema),
    defaultValues: {
      reason: "",
      suspensionNotice: "",
    },
  });

  const terminateRHF = useForm<TerminateContractValues>({
    resolver: zodResolver(terminateContractSchema),
    defaultValues: {
      reason: "",
    },
  });

  const portalRHF = useForm<CustomerPortalAccessValues>({
    resolver: zodResolver(customerPortalAccessSchema),
    defaultValues: {
      email: "",
      password: "",
      portalEnabled: true,
    },
  });

  const dispatchRHF = useForm<SendSignatureValues>({
    resolver: zodResolver(sendSignatureSchema),
    defaultValues: {
      contractId: "",
      templateId: "",
    },
  });

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
      killSwitchRHF.reset();
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
      contractRHF.reset({
        customerId: customerId || "",
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
      terminateRHF.reset();
    },
    onError: (err) => {
      alert(`Error terminating contract: ${err.message}`);
    },
  });

  const setPortalAccessMutation = api.customer.setPortalAccess.useMutation({
    onSuccess: () => {
      utils.customer.getById.invalidate({ id: customerId });
      setPortalModalOpen(false);
      portalRHF.reset();
    },
    onError: (err) => {
      alert(`Portal access error: ${err.message}`);
    },
  });

  const sendForSignatureMutation = api.contract.sendForSignature.useMutation({
    onSuccess: (data) => {
      utils.customer.getById.invalidate({ id: customerId });
      setDispatchModalContract(null);
      dispatchRHF.reset();
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
    killSwitchRHF.reset({
      reason: "",
      suspensionNotice:
        lic.suspensionNotice ||
        "Your service access is temporarily suspended due to outstanding billing ledger accounts. Please contact operations to resolve.",
    });
    setKillSwitchModalOpen(true);
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

  const handleOpenContractModal = () => {
    contractRHF.reset({
      customerId: customerId || "",
      title: "",
      value: 0,
      currency: "USD",
      billingCycle: "MONTHLY",
      status: "DRAFT",
      terms: "",
      notes: "",
    });
    setContractModalOpen(true);
  };

  const handleOpenPortalModal = () => {
    if (!customer) return;
    portalRHF.reset({
      email: customer.email || "",
      password: "",
      portalEnabled: customer.portalEnabled ?? true,
    });
    setPortalModalOpen(true);
  };

  const handleOpenDispatchModal = (c: any) => {
    setDispatchModalContract(c);
    dispatchRHF.reset({
      contractId: c.id,
      templateId: "",
    });
  };

  const handleOpenTerminateModal = (contractId: string) => {
    setTerminateContractId(contractId);
    terminateRHF.reset({ reason: "" });
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
            onClick={handleOpenContractModal}
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
                  onClick={handleOpenPortalModal}
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
            onClick={handleOpenContractModal}
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
                              onClick={() => handleOpenDispatchModal(c)}
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
                            onClick={() => handleOpenTerminateModal(c.id)}
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
                          <span>{lic.keyPrefix}</span>
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

          <Form {...killSwitchRHF}>
            <form onSubmit={killSwitchRHF.handleSubmit(onConfirmKillSwitch)} className="space-y-4 py-2 text-sm">
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

                  <FormField
                    control={killSwitchRHF.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Operator Rationale (Mandatory for Audit Trail) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Delinquent account past 30-day grace period"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={killSwitchRHF.control}
                    name="suspensionNotice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-foreground">
                          Client-Facing Suspension Notice
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Notice returned to client software upon verification failure"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <div className="p-3 bg-muted/40 rounded-xl text-xs space-y-1">
                  <p className="font-semibold text-foreground">Reactivate Client Software Access</p>
                  <p className="text-muted-foreground">
                    The client application will receive active authorization upon its next heartbeat check.
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setKillSwitchModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={selectedLicense?.status === "ACTIVE" ? "destructive" : "default"}
                  size="sm"
                  disabled={toggleLicenseMutation.isPending}
                >
                  {selectedLicense?.status === "ACTIVE" ? "Enforce Suspension" : "Confirm Reactivation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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

          <Form {...contractRHF}>
            <form
              onSubmit={contractRHF.handleSubmit((values) => {
                createContractMutation.mutate({
                  customerId,
                  title: values.title,
                  value: Number(values.value),
                  currency: values.currency,
                  billingCycle: values.billingCycle,
                  terms: values.terms,
                  notes: values.notes,
                  status: values.status,
                });
              })}
              className="space-y-4 py-2"
            >
              <FormField
                control={contractRHF.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">Contract Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Enterprise SaaS Platform License & Support"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={contractRHF.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground">Contract Value *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={contractRHF.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground">Billing Cycle</FormLabel>
                      <FormControl>
                        <NativeSelect {...field}>
                          <option value="MONTHLY">Monthly</option>
                          <option value="QUARTERLY">Quarterly</option>
                          <option value="ANNUALLY">Annually</option>
                          <option value="ONE_TIME">One-Time</option>
                        </NativeSelect>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={contractRHF.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">Contract Execution Mode</FormLabel>
                    <FormControl>
                      <NativeSelect {...field}>
                        <option value="DRAFT">Draft — Send for e-Signature via DocuSeal (Recommended)</option>
                        <option value="ACTIVE">Active — Pre-signed or Direct Activation</option>
                      </NativeSelect>
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Draft agreements can be dispatched to DocuSeal and signed digitally by the client.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contractRHF.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">Terms &amp; Commitments</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="SLA response guarantees, uptime targets, renewal conditions..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setContractModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createContractMutation.isPending}>
                  {createContractMutation.isPending ? "Creating..." : "Create Contract"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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

          <Form {...terminateRHF}>
            <form
              onSubmit={terminateRHF.handleSubmit((values) => {
                if (terminateContractId) {
                  terminateContractMutation.mutate({
                    id: terminateContractId,
                    reason: values.reason,
                  });
                }
              })}
              className="space-y-3 py-2 text-sm"
            >
              <p className="text-muted-foreground text-xs">
                Terminated contracts are permanently locked as immutable historical records and will cease contributing to active MRR calculations.
              </p>
              <FormField
                control={terminateRHF.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground">
                      Termination Reason (Mandatory) *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Mutual termination agreement / Non-payment"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setTerminateContractId(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={terminateContractMutation.isPending}
                >
                  {terminateContractMutation.isPending ? "Terminating..." : "Terminate Contract"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
            <Form {...dispatchRHF}>
              <form
                onSubmit={dispatchRHF.handleSubmit((values) => {
                  sendForSignatureMutation.mutate({
                    contractId: values.contractId,
                    templateId: values.templateId ? values.templateId.trim() : undefined,
                  });
                })}
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

                <FormField
                  control={dispatchRHF.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground">
                        DocuSeal Template ID (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 12345 or template slug (leave blank for dynamic agreement)"
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Enter the ID or slug of your DocuSeal template. If left blank, our dynamic contract document generator will be used.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </Form>
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

      {/* Client Portal Credentials Management Dialog */}
      <Dialog open={portalModalOpen} onOpenChange={(open) => !open && setPortalModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <span>Client Portal Access &amp; Credentials</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure email and password authentication for {customer.name}.
            </p>
          </DialogHeader>

          <Form {...portalRHF}>
            <form
              onSubmit={portalRHF.handleSubmit((values) => {
                setPortalAccessMutation.mutate({
                  customerId: customer.id,
                  email: values.email.trim().toLowerCase(),
                  password: values.password?.trim() || undefined,
                  portalEnabled: values.portalEnabled,
                });
              })}
              className="space-y-4 py-2"
            >
              {/* Status toggle */}
              <FormField
                control={portalRHF.control}
                name="portalEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Portal Access Status</p>
                      <p className="text-[11px] text-muted-foreground">
                        {field.value ? "Client can log into /portal" : "Portal access is disabled for this client"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={field.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(!field.value)}
                      className="text-xs h-8"
                    >
                      {field.value ? "Active" : "Disabled"}
                    </Button>
                  </div>
                )}
              />

              {/* Email Field */}
              <FormField
                control={portalRHF.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-foreground">Client Login Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="client@company.com"
                        className="text-xs h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={portalRHF.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-medium text-foreground">
                        {customer.clientUser ? "New Password (leave blank to keep current)" : "Initial Password"}
                      </FormLabel>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = Math.random().toString(36).slice(-8) + "!9A";
                          field.onChange(generated);
                        }}
                        className="text-[11px] text-primary hover:underline cursor-pointer"
                      >
                        Generate Password
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={customer.clientUser ? "Leave blank to keep existing password" : "Enter temporary password (min 6 chars)"}
                        className="text-xs h-9 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground">
                      Client login page: <span className="font-mono text-foreground">http://localhost:3000/portal/login</span>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPortalModalOpen(false)}
                  disabled={setPortalAccessMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={setPortalAccessMutation.isPending}
                  className="gap-1.5"
                >
                  <span>{setPortalAccessMutation.isPending ? "Saving..." : "Save Credentials"}</span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
