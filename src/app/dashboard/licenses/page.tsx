"use client";

import React, { useState } from "react";
import { 
  KeyRound, 
  Plus, 
  Search, 
  Check, 
  Copy, 
  Globe, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Code2, 
  RotateCw, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  AlertTriangle,
  X,
  Radio,
  Building2,
  Lock,
  FileCode
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatDate } from "~/lib/utils/format";
import { maskLicenseKey } from "~/lib/license/keygen";

export default function LicensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "REVOKED">("ALL");
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);
  const [createdKeyModal, setCreatedKeyModal] = useState<{ key: string; name: string } | null>(null);
  const [snippetDrawerLicense, setSnippetDrawerLicense] = useState<any | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<"trpc" | "node" | "nextjs" | "python" | "php">("trpc");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    allowedDomain: "",
    suspensionNotice: "Service temporarily suspended by administrator. Please contact billing to restore access.",
    leaseTtlMinutes: 60,
    gracePeriodHours: 3,
  });

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
    },
    onError: (err) => {
      alert(`Error toggling status: ${err.message}`);
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

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      customerId: "",
      allowedDomain: "",
      suspensionNotice: "Service temporarily suspended by administrator. Please contact billing to restore access.",
      leaseTtlMinutes: 60,
      gracePeriodHours: 3,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (lic: any) => {
    setEditingLicense(lic);
    setFormData({
      name: lic.name,
      customerId: lic.customerId || "",
      allowedDomain: lic.allowedDomain || "",
      suspensionNotice: lic.suspensionNotice || "Service temporarily suspended. Contact billing.",
      leaseTtlMinutes: lic.leaseTtlMinutes || 60,
      gracePeriodHours: lic.gracePeriodHours || 3,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLicense) {
      updateMutation.mutate({
        id: editingLicense.id,
        ...formData,
        customerId: formData.customerId || null,
        allowedDomain: formData.allowedDomain || null,
        suspensionNotice: formData.suspensionNotice || null,
      });
    } else {
      createMutation.mutate({
        ...formData,
        customerId: formData.customerId || null,
        allowedDomain: formData.allowedDomain || null,
        suspensionNotice: formData.suspensionNotice || null,
      });
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">License & Service Kill-Switch</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Monitor client software heartbeats and remotely suspend access for billing enforcement
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition-all active:scale-[0.98] self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue License Key
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Services */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Services</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {loadingMetrics ? "..." : metrics?.active ?? 0}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 font-medium">Healthy & verifying</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Suspended / Kill-Switched */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kill-Switched</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {loadingMetrics ? "..." : metrics?.suspended ?? 0}
              </p>
              <p className="text-xs text-rose-600 font-medium mt-1">
                {metrics?.suspended ? "Services halted" : "No active suspensions"}
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          {/* Total Verifications Today */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total API Pings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {loadingMetrics ? "..." : (metrics?.totalChecks ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">All-time verifications</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          {/* Total Keys Issued */}
          <div className="bg-white p-5 rounded-xl border border-gray-200/90 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Issued Keys</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">
                {loadingMetrics ? "..." : metrics?.total ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Registered clients</p>
            </div>
            <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
              <Radio className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by service, client, domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {(["ALL", "ACTIVE", "SUSPENDED", "REVOKED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st === "ALL" ? "All Keys" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Licenses Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200/80 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="py-3 px-5">Service & Client</th>
                  <th className="py-3 px-5">API Key</th>
                  <th className="py-3 px-5">Domain Lock</th>
                  <th className="py-3 px-5">Last Ping</th>
                  <th className="py-3 px-5">Kill-Switch</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingLicenses ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Loading licenses...
                    </td>
                  </tr>
                ) : !licenses || licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="max-w-sm mx-auto space-y-3">
                        <KeyRound className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="text-gray-700 font-semibold text-base">No licenses found</p>
                        <p className="text-gray-400 text-xs">
                          {searchTerm || statusFilter !== "ALL"
                            ? "Try adjusting your search query or status filter."
                            : "Issue your first license key to start protecting and monitoring client services."}
                        </p>
                        {!searchTerm && statusFilter === "ALL" && (
                          <button
                            onClick={handleOpenCreate}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Issue first key
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic) => {
                    const isSuspended = lic.status === "SUSPENDED";
                    const isRevoked = lic.status === "REVOKED";
                    const isActive = lic.status === "ACTIVE";

                    return (
                      <tr key={lic.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Service & Client */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : isSuspended
                                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  : "bg-gray-100 text-gray-500 border border-gray-200"
                              }`}
                            >
                              <KeyRound className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 leading-tight truncate">
                                {lic.name}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                                <span className="truncate">{lic.customer?.name || "Unassigned client"}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* API Key */}
                        <td className="py-4 px-5">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md font-mono text-xs text-gray-700">
                            <span>{maskLicenseKey(lic.key)}</span>
                            <button
                              onClick={() => handleCopyKey(lic.key, lic.id)}
                              className="p-1 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                              title="Copy full key"
                            >
                              {copiedKeyId === lic.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Domain Lock */}
                        <td className="py-4 px-5">
                          {lic.allowedDomain ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono">
                              <Globe className="w-3 h-3" />
                              {lic.allowedDomain}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Any domain</span>
                          )}
                        </td>

                        {/* Last Ping & Activity */}
                        <td className="py-4 px-5">
                          <div>
                            <p className="text-xs font-medium text-gray-700">
                              {getRelativeTime(lic.lastCheckedAt)}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {lic.checkCount} {lic.checkCount === 1 ? "ping" : "pings"}
                            </p>
                          </div>
                        </td>

                        {/* Kill-Switch Control */}
                        <td className="py-4 px-5">
                          {isRevoked ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              Revoked
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  id: lic.id,
                                  status: isActive ? "SUSPENDED" : "ACTIVE",
                                })
                              }
                              disabled={toggleStatusMutation.isPending}
                              className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                                isActive
                                  ? "bg-emerald-500 focus:ring-emerald-400"
                                  : "bg-rose-500 focus:ring-rose-400"
                              }`}
                              title={isActive ? "Click to suspend service" : "Click to reactivate service"}
                            >
                              <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-xs ${
                                  isActive ? "translate-x-7" : "translate-x-1"
                                }`}
                              />
                            </button>
                          )}
                          <span
                            className={`ml-2 text-xs font-semibold uppercase tracking-wider ${
                              isActive
                                ? "text-emerald-700"
                                : isSuspended
                                ? "text-rose-700"
                                : "text-gray-500"
                            }`}
                          >
                            {lic.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Code Snippet */}
                            <button
                              onClick={() => setSnippetDrawerLicense(lic)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                              title="View integration code snippet"
                            >
                              <Code2 className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEdit(lic)}
                              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Edit details & suspension notice"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Rotate Key */}
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Regenerate key for "${lic.name}"? The old key will immediately stop working.`
                                  )
                                ) {
                                  regenerateKeyMutation.mutate({ id: lic.id });
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-amber-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Rotate secret key"
                            >
                              <RotateCw className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete license "${lic.name}"?`
                                  )
                                ) {
                                  deleteMutation.mutate({ id: lic.id });
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Delete license"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isCreateModalOpen || editingLicense) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingLicense ? "Edit License Configuration" : "Issue New License Key"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingLicense(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
              {/* Service / Project Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Service / Project Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp Web App or Client E-commerce Backend"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Linked Customer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Assigned Customer (Optional)
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="">-- No customer assigned --</option>
                  {customers?.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.email ? `(${cust.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Allowed Domain */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Allowed Domain Lock (Optional)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. clientapp.com or portal.acme.org"
                    value={formData.allowedDomain}
                    onChange={(e) => setFormData({ ...formData, allowedDomain: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  If set, requests from other domains will be rejected with 403 Forbidden.
                </p>
              </div>

              {/* Custom Suspension Notice */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Custom Suspension Notice
                </label>
                <textarea
                  rows={2}
                  value={formData.suspensionNotice}
                  onChange={(e) => setFormData({ ...formData, suspensionNotice: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="Message returned in the API when you trigger the kill-switch"
                />
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Returned to the client website backend when the service is deactivated.
                </p>
              </div>

              {/* Lease TTL & Grace Period */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Lease TTL (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={formData.leaseTtlMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, leaseTtlMinutes: parseInt(e.target.value) || 60 })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Recommended: 60 mins</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    Grace Window (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={formData.gracePeriodHours}
                    onChange={(e) =>
                      setFormData({ ...formData, gracePeriodHours: parseInt(e.target.value) || 3 })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Tolerance on downtime</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingLicense(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-[0.98] shadow-xs cursor-pointer"
                >
                  {editingLicense
                    ? updateMutation.isPending
                      ? "Saving..."
                      : "Save Changes"
                    : createMutation.isPending
                    ? "Generating..."
                    : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW KEY ANNOUNCEMENT MODAL */}
      {createdKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">License Key Ready!</h3>
              <p className="text-xs text-gray-500 mt-1">
                Generated secret key for <span className="font-semibold text-gray-800">{createdKeyModal.name}</span>
              </p>
            </div>

            {/* Key Container */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-left">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Secret License Key
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-blue-700 break-all select-all">
                  {createdKeyModal.key}
                </code>
                <button
                  onClick={() => handleCopyKey(createdKeyModal.key, "modal")}
                  className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 shrink-0 cursor-pointer shadow-2xs"
                  title="Copy Key"
                >
                  {copiedKeyId === "modal" ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Provide this key to your client or embed it into their application environment variables (`LICENSE_KEY`).
              </p>
            </div>

            <button
              onClick={() => setCreatedKeyModal(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* CODE SNIPPET DRAWER */}
      {snippetDrawerLicense && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Integration Snippet
                    </h2>
                    <p className="text-xs text-gray-500">
                      Service: <span className="font-semibold text-gray-800">{snippetDrawerLicense.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSnippetDrawerLicense(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Snippet Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                {[
                  { id: "trpc", label: "tRPC Middleware" },
                  { id: "node", label: "Node.js / Express" },
                  { id: "nextjs", label: "Next.js Middleware" },
                  { id: "python", label: "Python" },
                  { id: "php", label: "PHP" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSnippetTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeSnippetTab === tab.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div className="relative bg-gray-950 rounded-xl p-4 text-gray-200 font-mono text-xs overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-3">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                    {activeSnippetTab.toUpperCase()} Integration
                  </span>
                  <button
                    onClick={() => {
                      const snippet = getCodeSnippet(activeSnippetTab, snippetDrawerLicense.key);
                      navigator.clipboard.writeText(snippet);
                      setCopiedKeyId("snippet");
                      setTimeout(() => setCopiedKeyId(null), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md text-[11px] cursor-pointer transition-colors"
                  >
                    {copiedKeyId === "snippet" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {getCodeSnippet(activeSnippetTab, snippetDrawerLicense.key)}
                </pre>
              </div>

              {/* Explanation Note */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Short Cached Lease Architecture:
                </p>
                <p className="text-blue-800/90 leading-relaxed text-[11px]">
                  The client application caches this response in memory and only verifies once per hour. 
                  When you toggle <strong>Suspend</strong> in your dashboard, the client's next lease renewal will fail, automatically disabling access.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSnippetDrawerLicense(null)}
              className="w-full py-2.5 mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close Integration Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getCodeSnippet(lang: string, key: string): string {
  const endpoint = "http://localhost:3000/api/v1/licenses/verify";

  switch (lang) {
    case "trpc":
      return `import { TRPCError } from "@trpc/server";

interface LicensePayload {
  active: boolean;
  status?: "ACTIVE" | "SUSPENDED" | "DOMAIN_MISMATCH" | "REVOKED" | string;
  reason?: string;
  error?: string;
  serviceName?: string;
  leaseExpiresAt?: string; // ISO 8601 timestamp
  checkedAt?: string;
}

// In-memory cache to persist the latest valid lease across requests
let cachedLicense: LicensePayload | null = null;

export const verifyLicense = t.middleware(async ({ ctx, next }) => {
  const licenseUrl = process.env.LICENSE_SERVER_URL ?? "${endpoint}";
  const licenseKey = process.env.LIC_KEY ?? "${key}";
  const now = Date.now();
  const leaseEnd = cachedLicense?.leaseExpiresAt
    ? new Date(cachedLicense.leaseExpiresAt).getTime()
    : 0;

  // 1. FAST PATH: Pass immediately with 0ms latency if current lease is still valid
  if (cachedLicense?.active && leaseEnd > now) {
    return next({
      ctx: { ...ctx, license: cachedLicense },
    });
  }

  // 2. NETWORK PATH: Fetch fresh lease when expired or upon initial container boot
  let payload: LicensePayload | null = null;
  let isNetworkFailure = false;

  try {
    const res = await fetch(licenseUrl, {
      method: "GET",
      headers: {
        Authorization: \`Bearer \${licenseKey}\`,
        "x-origin-domain": process.env.APP_DOMAIN ?? "",
      },
      signal: AbortSignal.timeout(3000), // Fast 3s timeout to prevent request stalls
      cache: "no-store",
    });

    if ([200, 400, 401, 403].includes(res.status)) {
      payload = (await res.json()) as LicensePayload;
    } else {
      isNetworkFailure = true;
    }
  } catch {
    // Network drop, DNS failure, or timeout
    isNetworkFailure = true;
  }

  // 3. LEASE RECOVERY: Tolerates temporary billing server downtime
  if (isNetworkFailure) {
    // Grace period check: allow request if previously cached lease is active and unexpired
    if (cachedLicense?.active && leaseEnd > now) {
      return next({
        ctx: { ...ctx, license: cachedLicense },
      });
    }

    // No valid lease exists or the grace period has lapsed
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Licensing service unreachable and local lease grace period has expired.",
    });
  }

  // 4. ACTIVE LICENSE: Update local cache with the newest lease details
  if (payload?.active) {
    cachedLicense = payload;
    return next({
      ctx: { ...ctx, license: payload },
    });
  }

  // 5. EXPLICIT DENIAL (Suspended, Revoked, Mismatched): Invalidate cache immediately
  cachedLicense = null;
  const message = payload?.reason || payload?.error || "Service suspended. Contact billing.";

  switch (payload?.status) {
    case "REVOKED":
      throw new TRPCError({ code: "UNAUTHORIZED", message });
    case "DOMAIN_MISMATCH":
    case "SUSPENDED":
    default:
      throw new TRPCError({ code: "FORBIDDEN", message });
  }
});`;

    case "node":
      return `// Express.js middleware with 1-hour cached lease
let cachedLease = null;

async function checkLicenseStatus() {
  const now = Date.now();
  if (cachedLease && now < cachedLease.expiry) {
    return cachedLease.active;
  }

  try {
    const res = await fetch("${endpoint}", {
      headers: { "Authorization": "Bearer ${key}" }
    });
    const data = await res.json();

    if (!data.active) {
      console.error("SERVICE SUSPENDED:", data.reason);
      return false;
    }

    cachedLease = {
      active: true,
      expiry: new Date(data.leaseExpiresAt).getTime()
    };
    return true;
  } catch (err) {
    // Fail-open tolerance during billing server maintenance
    return true;
  }
}

app.use(async (req, res, next) => {
  const isActive = await checkLicenseStatus();
  if (!isActive) {
    return res.status(402).send("Service temporarily suspended for billing review.");
  }
  next();
});`;

    case "nextjs":
      return `// middleware.ts in client Next.js app
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = await fetch("${endpoint}", {
    headers: { "Authorization": "Bearer ${key}" },
    next: { revalidate: 3600 } // Cache verification for 1 hour
  });
  
  const license = await res.json();
  if (!license.active) {
    return new NextResponse(
      license.reason || "Service Suspended. Contact Billing.", 
      { status: 402 }
    );
  }
  return NextResponse.next();
}`;

    case "python":
      return `import time
import requests

LICENSE_KEY = "${key}"
VERIFY_URL = "${endpoint}"

_cached_expiry = 0
_is_active = True

def verify_service_active():
    global _cached_expiry, _is_active
    now = time.time()
    
    if now < _cached_expiry:
        return _is_active
        
    try:
        resp = requests.get(
            VERIFY_URL, 
            headers={"Authorization": f"Bearer {LICENSE_KEY}"},
            timeout=5
        )
        data = resp.json()
        _is_active = data.get("active", False)
        # Cache for 1 hour
        _cached_expiry = now + data.get("nextCheckInSeconds", 3600)
        return _is_active
    except Exception:
        # Fail-open buffer on server downtime
        return True`;

    case "php":
      return `<?php
// PHP cURL verification with session/APCu caching
function is_service_licensed() {
    $cache_key = 'license_lease_expiry';
    $key = "${key}";
    $url = "${endpoint}";

    if (isset($_SESSION[$cache_key]) && time() < $_SESSION[$cache_key]) {
        return true;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer " . $key]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (!empty($data['active'])) {
        $_SESSION[$cache_key] = time() + ($data['nextCheckInSeconds'] ?? 3600);
        return true;
    }

    http_response_code(402);
    die($data['reason'] ?? "Service suspended.");
}`;

    default:
      return "";
  }
}
