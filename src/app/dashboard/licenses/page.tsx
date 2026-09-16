"use client";

import React, { useState } from "react";
import { 
  KeyRound, 
  Plus, 
  Globe, 
  Building2,
  Code2, 
  RotateCw, 
  Trash2, 
  Edit3
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { type CreateLicenseValues, type GuardrailSuspensionValues } from "~/lib/schemas/forms";

import { LicenseMetricsRow } from "~/features/licenses/components/LicenseMetricsRow";
import { LicenseFilterBar } from "~/features/licenses/components/LicenseFilterBar";
import { LicenseUpsertDialog } from "~/features/licenses/components/LicenseUpsertDialog";
import { SuspendLicenseDialog } from "~/features/licenses/components/SuspendLicenseDialog";
import { CreatedKeyModal } from "~/features/licenses/components/CreatedKeyModal";
import { CodeSnippetDrawer } from "~/features/licenses/components/CodeSnippetDrawer";

export default function LicensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "REVOKED">("ALL");
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);
  const [createdKeyModal, setCreatedKeyModal] = useState<{ key: string; name: string } | null>(null);
  const [snippetDrawerLicense, setSnippetDrawerLicense] = useState<any | null>(null);
  const [guardrailModalLicense, setGuardrailModalLicense] = useState<any>(null);

  const utils = api.useUtils();

  // Queries
  const { data: metrics, isLoading: loadingMetrics } = api.license.getMetrics.useQuery(undefined, {
    refetchInterval: 15000,
  });

  const { data: licenses, isLoading: loadingLicenses } = api.license.getAll.useQuery({
    search: searchTerm,
    status: statusFilter,
  }, {
    refetchInterval: 10000,
  });

  const { data: customers } = api.customer.getAll.useQuery();

  // Mutations
  const createMutation = api.license.create.useMutation({
    onSuccess: (newLicense) => {
      utils.license.getAll.invalidate();
      utils.license.getMetrics.invalidate();
      setIsCreateModalOpen(false);
      setCreatedKeyModal({ key: newLicense.key, name: newLicense.name });
    },
    onError: (err) => {
      alert(`Error creating license: ${err.message}`);
    },
  });

  const updateMutation = api.license.update.useMutation({
    onSuccess: () => {
      utils.license.getAll.invalidate();
      utils.license.getMetrics.invalidate();
      setEditingLicense(null);
    },
    onError: (err) => {
      alert(`Error updating license: ${err.message}`);
    },
  });

  const toggleStatusMutation = api.license.toggleStatus.useMutation({
    onSuccess: () => {
      utils.license.getAll.invalidate();
      utils.license.getMetrics.invalidate();
      setGuardrailModalLicense(null);
    },
    onError: (err) => {
      alert(`Guardrail error: ${err.message}`);
    },
  });

  const regenerateKeyMutation = api.license.regenerateKey.useMutation({
    onSuccess: (updated) => {
      utils.license.getAll.invalidate();
      setCreatedKeyModal({ key: updated.key, name: updated.name });
    },
    onError: (err) => {
      alert(`Error regenerating key: ${err.message}`);
    },
  });

  const deleteMutation = api.license.delete.useMutation({
    onSuccess: () => {
      utils.license.getAll.invalidate();
      utils.license.getMetrics.invalidate();
    },
    onError: (err) => {
      alert(`Error deleting license: ${err.message}`);
    },
  });

  const handleOpenCreate = () => {
    setEditingLicense(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (lic: any) => {
    setEditingLicense(lic);
    setIsCreateModalOpen(true);
  };

  const onSubmitLicense = (values: CreateLicenseValues) => {
    if (editingLicense) {
      updateMutation.mutate({
        id: editingLicense.id,
        ...values,
        customerId: values.customerId || null,
        allowedDomain: values.allowedDomain || null,
        suspensionNotice: values.suspensionNotice || null,
      });
    } else {
      createMutation.mutate({
        ...values,
        customerId: values.customerId || null,
        allowedDomain: values.allowedDomain || null,
        suspensionNotice: values.suspensionNotice || null,
      });
    }
  };

  const onSubmitGuardrail = (values: GuardrailSuspensionValues) => {
    if (!guardrailModalLicense) return;
    toggleStatusMutation.mutate({
      id: guardrailModalLicense.id,
      status: "SUSPENDED",
      reason: values.reason,
      suspensionNotice: values.suspensionNotice,
    });
  };

  const getRelativeTime = (date?: Date | string | null) => {
    if (!date) return "Never";
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(date);
  };

  return (
    <div className="space-y-7 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Runtime Telemetry &amp; Security
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            License &amp; Service Kill-Switch
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor client software heartbeats and remotely suspend access for billing enforcement
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Issue License Key</span>
        </Button>
      </div>

      {/* Telemetry Grid */}
      <LicenseMetricsRow metrics={metrics} isLoading={loadingMetrics} />

      {/* Filter and Search Bar */}
      <LicenseFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Licenses Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Service &amp; Client</th>
                <th className="py-3 px-5">API Key</th>
                <th className="py-3 px-5">Domain Lock</th>
                <th className="py-3 px-5">Last Ping</th>
                <th className="py-3 px-5">Kill-Switch</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loadingLicenses ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading licenses...
                  </td>
                </tr>
              ) : !licenses || licenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-muted-foreground space-y-3">
                    <KeyRound className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-foreground font-semibold text-base">No licenses found</p>
                    <p className="text-xs">
                      {searchTerm || statusFilter !== "ALL"
                        ? "Try adjusting your search query or status filter."
                        : "Issue your first license key to start protecting and monitoring client services."}
                    </p>
                    {!searchTerm && statusFilter === "ALL" && (
                      <Button
                        onClick={handleOpenCreate}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Issue first key</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                licenses.map((lic) => {
                  const isSuspended = lic.status === "SUSPENDED";
                  const isRevoked = lic.status === "REVOKED";
                  const isActive = lic.status === "ACTIVE";

                  return (
                    <tr key={lic.id} className="hover:bg-muted/30 transition-colors">
                      {/* Service & Client */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : isSuspended
                                ? "bg-destructive/10 text-destructive border border-destructive/20"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground leading-tight truncate">
                              {lic.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                              <span className="truncate">{lic.customer?.name || "Unassigned client"}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* API Key */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-muted/50 border border-border rounded-md font-mono text-xs text-foreground">
                          <span>{lic.keyPrefix}</span>
                        </div>
                      </td>

                      {/* Domain Lock */}
                      <td className="py-4 px-5">
                        {lic.allowedDomain ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono">
                            <Globe className="w-3 h-3" />
                            {lic.allowedDomain}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Any domain</span>
                        )}
                      </td>

                      {/* Last Ping & Activity */}
                      <td className="py-4 px-5">
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {getRelativeTime(lic.lastCheckedAt)}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {lic.checkCount} {lic.checkCount === 1 ? "ping" : "pings"}
                          </p>
                        </div>
                      </td>

                      {/* Kill-Switch Control */}
                      <td className="py-4 px-5">
                        {isRevoked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                            Revoked
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (isActive) {
                                setGuardrailModalLicense(lic);
                              } else {
                                toggleStatusMutation.mutate({
                                  id: lic.id,
                                  status: "ACTIVE",
                                  reason: "Service reactivated by operator",
                                });
                              }
                            }}
                            disabled={toggleStatusMutation.isPending}
                            className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                              isActive
                                ? "bg-emerald-500 focus:ring-emerald-400"
                                : "bg-destructive focus:ring-destructive"
                            }`}
                            title={isActive ? "Click to suspend service (guardrail enforced)" : "Click to reactivate service"}
                          >
                            <span
                              className={`inline-block w-4 h-4 transform bg-background rounded-full transition-transform shadow-xs ${
                                isActive ? "translate-x-7" : "translate-x-1"
                              }`}
                            />
                          </button>
                        )}
                        <span
                          className={`ml-2 text-xs font-semibold uppercase tracking-wider ${
                            isActive
                              ? "text-emerald-600"
                              : isSuspended
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {lic.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSnippetDrawerLicense(lic)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="View integration code snippet"
                          >
                            <Code2 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(lic)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit details & suspension notice"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Regenerate key for "${lic.name}"? The old key will immediately stop working.`)) {
                                regenerateKeyMutation.mutate({ id: lic.id });
                              }
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-amber-600"
                            title="Rotate secret key"
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete license "${lic.name}"?`)) {
                                deleteMutation.mutate({ id: lic.id });
                              }
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Delete license"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Extracted Modals */}
      <LicenseUpsertDialog
        isOpen={isCreateModalOpen}
        editingLicense={editingLicense}
        customers={customers}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingLicense(null);
        }}
        onSubmit={onSubmitLicense}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <SuspendLicenseDialog
        license={guardrailModalLicense}
        onClose={() => setGuardrailModalLicense(null)}
        onSuspend={onSubmitGuardrail}
        isPending={toggleStatusMutation.isPending}
      />

      <CreatedKeyModal
        data={createdKeyModal}
        onClose={() => setCreatedKeyModal(null)}
      />

      <CodeSnippetDrawer
        license={snippetDrawerLicense}
        onClose={() => setSnippetDrawerLicense(null)}
      />
    </div>
  );
}
