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
  ArrowRight
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    value: 0,
    currency: "USD",
    billingCycle: "MONTHLY" as "MONTHLY" | "QUARTERLY" | "ANNUALLY" | "ONE_TIME",
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

      {/* Contracts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Contract #</th>
                <th className="py-3 px-5">Title &amp; Client</th>
                <th className="py-3 px-5">Cycle</th>
                <th className="py-3 px-5">Status</th>
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
                      {c.contractNumber}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-foreground text-xs sm:text-sm">{c.title}</p>
                      <Link
                        href={`/dashboard/customers/${c.customerId}`}
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
                      <Badge
                        variant={
                          c.status === "ACTIVE"
                            ? "success"
                            : c.status === "TERMINATED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {formatDate(c.startDate)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-foreground text-xs sm:text-sm">
                      {formatCurrency(c.value, c.currency)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {c.status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTerminateContractId(c.id);
                            setTerminateReason("");
                          }}
                          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Terminate
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">Immutable</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
                status: "ACTIVE",
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
