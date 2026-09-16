"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  Check,
  Landmark,
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "~/trpc/react";
import { LogoUploader } from "~/components/invoice/LogoUploader";
import { SignaturePad } from "~/components/invoice/SignaturePad";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useCompany } from "~/components/company/CompanyContext";

export default function SettingsPage() {
  const { activeCompany } = useCompany();
  const utils = api.useUtils();

  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "",
    taxId: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    logoUrl: null as string | null,
    signatureData: null as string | null,
    currency: "USD",
    paymentTerms: "Payment due upon receipt",
    notes: "Thank you for your business!",
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Members state
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const { data, isLoading } = api.profile.get.useQuery();
  const { data: members, isLoading: isMembersLoading } = api.company.getMembers.useQuery();

  const addMemberMutation = api.company.addMember.useMutation({
    onSuccess: () => {
      setMemberSuccess("Member added to workspace.");
      setNewMemberEmail("");
      setMemberError(null);
      void utils.company.getMembers.invalidate();
      setTimeout(() => setMemberSuccess(null), 3000);
    },
    onError: (err) => {
      setMemberError(err.message);
      setMemberSuccess(null);
    },
  });

  const updateRoleMutation = api.company.updateMemberRole.useMutation({
    onSuccess: () => {
      setMemberSuccess("Role updated.");
      setMemberError(null);
      void utils.company.getMembers.invalidate();
      void utils.company.list.invalidate();
      setTimeout(() => setMemberSuccess(null), 3000);
    },
    onError: (err) => {
      setMemberError(err.message);
      setMemberSuccess(null);
    },
  });

  const removeMemberMutation = api.company.removeMember.useMutation({
    onSuccess: () => {
      setMemberSuccess("Member removed.");
      setMemberError(null);
      void utils.company.getMembers.invalidate();
      void utils.company.list.invalidate();
      setTimeout(() => setMemberSuccess(null), 3000);
    },
    onError: (err) => {
      setMemberError(err.message);
      setMemberSuccess(null);
    },
  });

  const isOwner = activeCompany?.role === "OWNER";
  const isAdmin = activeCompany?.role === "ADMIN";

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setMemberError(null);
    addMemberMutation.mutate({
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return (
          <Badge variant="default" className="gap-1 bg-purple-600 text-white hover:bg-purple-700">
            <Crown className="w-3 h-3" />
            <span>Owner</span>
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge variant="secondary" className="gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <User className="w-3 h-3" />
            <span>Member</span>
          </Badge>
        );
    }
  };

  useEffect(() => {
    if (data) {
      setProfileData({
        companyName: data.companyName ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        zipCode: data.zipCode ?? "",
        country: data.country ?? "",
        taxId: data.taxId ?? "",
        bankName: (data as any).bankName ?? "",
        bankAccountName: (data as any).bankAccountName ?? "",
        bankAccountNumber: (data as any).bankAccountNumber ?? "",
        logoUrl: data.logoUrl ?? null,
        signatureData: (data as any).signatureData ?? null,
        currency: data.currency ?? "USD",
        paymentTerms: data.paymentTerms ?? "Payment due upon receipt",
        notes: data.notes ?? "Thank you for your business!",
      });
    }
  }, [data]);

  const upsertMutation = api.profile.upsert.useMutation({
    onSuccess: () => {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    onError: (err) => {
      alert(`Failed to save settings: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(profileData);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Business Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Configure default company sender information, currency, payment details, and terms
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as string)} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl h-10 w-fit">
          <TabsTrigger value="profile" className="gap-2 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-card">
            <Building2 className="w-3.5 h-3.5" />
            <span>Company Profile &amp; Banking</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2 text-xs font-semibold px-3 py-1.5 data-[state=active]:bg-card">
            <Users className="w-3.5 h-3.5" />
            <span>Workspace Members ({members?.length || 0})</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile & Banking */}
        <TabsContent value="profile" className="pt-2">
          <Card>
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-border text-sm font-semibold text-foreground">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Company &amp; Sender Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Company / Legal Name</label>
                  <Input
                    type="text"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Tax / VAT ID</label>
                  <Input
                    type="text"
                    value={profileData.taxId}
                    onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Billing Email</label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Phone</label>
                  <Input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-border text-sm">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Street Address</label>
                  <Input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">City</label>
                    <Input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Postal Code</label>
                    <Input
                      type="text"
                      value={profileData.zipCode}
                      onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Country</label>
                    <Input
                      type="text"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-border text-sm">
                <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                  Default Invoicing Terms
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Default Currency</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-lg bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                      value={profileData.currency}
                      onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Default Payment Terms</label>
                    <Input
                      type="text"
                      value={profileData.paymentTerms}
                      onChange={(e) => setProfileData({ ...profileData, paymentTerms: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Default Notes / Memo</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-input bg-card text-foreground rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                    value={profileData.notes}
                    onChange={(e) => setProfileData({ ...profileData, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Bank & Payment Information */}
              <div className="space-y-4 pt-2 border-t border-border text-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Landmark className="w-4 h-4 text-primary" />
                  <span>Payment &amp; Bank Information</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide banking details to automatically pre-fill wire/ACH payment instructions on invoices.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Bank Name</label>
                    <Input
                      type="text"
                      placeholder="e.g. Chase"
                      value={profileData.bankName}
                      onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Account Beneficiary</label>
                    <Input
                      type="text"
                      placeholder="e.g. Acme Studio LLC"
                      value={profileData.bankAccountName}
                      onChange={(e) => setProfileData({ ...profileData, bankAccountName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Account # / IBAN</label>
                    <Input
                      type="text"
                      placeholder="e.g. 1234567890"
                      value={profileData.bankAccountNumber}
                      onChange={(e) => setProfileData({ ...profileData, bankAccountNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Company Branding & Signature */}
              <div className="space-y-4 pt-2 border-t border-border text-sm">
                <h3 className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                  Company Branding &amp; Default Signature
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your default logo and authorized signature will be automatically pre-filled on every newly created invoice.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="bg-muted/40 p-4 rounded-xl border border-border">
                    <LogoUploader
                      value={profileData.logoUrl}
                      onChange={(logo) => setProfileData({ ...profileData, logoUrl: logo })}
                    />
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl border border-border">
                    <SignaturePad
                      value={profileData.signatureData}
                      onChange={(sig) => setProfileData({ ...profileData, signatureData: sig })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                {savedSuccess ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <Check className="w-4 h-4" /> Changes saved successfully!
                  </span>
                ) : (
                  <span />
                )}

                <Button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{upsertMutation.isPending ? "Saving..." : "Save Settings"}</span>
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Workspace Members */}
        <TabsContent value="members" className="pt-2">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="w-5 h-5 text-primary" />
                  <span>Team &amp; Workspace Members</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Members with access to the <span className="font-semibold text-foreground">{activeCompany?.name}</span> billing command center
                </p>
              </div>
              {activeCompany?.role && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
                  Your role: <strong className="text-foreground">{activeCompany.role}</strong>
                </span>
              )}
            </div>

            {/* Notifications */}
            {memberError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{memberError}</span>
              </div>
            )}

            {memberSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{memberSuccess}</span>
              </div>
            )}

            {/* Add member form */}
            {(isOwner || isAdmin) && (
              <form onSubmit={handleAddMember} className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <span>Invite or Add Team Member</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Input
                    type="email"
                    required
                    placeholder="colleague@company.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    disabled={addMemberMutation.isPending}
                    className="h-9 text-xs flex-1"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as "ADMIN" | "MEMBER")}
                    disabled={addMemberMutation.isPending}
                    className="h-9 px-3 rounded-lg border border-input bg-card text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
                  >
                    <option value="MEMBER">Member (Read &amp; Create)</option>
                    <option value="ADMIN">Admin (Full Management)</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                    size="sm"
                    className="h-9 gap-1.5 text-xs font-semibold"
                  >
                    {addMemberMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Member</span>
                  </Button>
                </div>
              </form>
            )}

            {/* Member List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Team Member ({members?.length || 0})</span>
                <span>Role / Actions</span>
              </div>

              {isMembersLoading ? (
                <div className="py-8 flex items-center justify-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading workspace members...</span>
                </div>
              ) : members && members.length > 0 ? (
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-9 rounded-lg">
                          <AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
                          <AvatarFallback className="rounded-lg text-xs font-semibold">
                            {member.user.name?.slice(0, 2).toUpperCase() || "OP"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {member.user.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isOwner ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                memberId: member.id,
                                role: e.target.value as "OWNER" | "ADMIN" | "MEMBER",
                              })
                            }
                            disabled={updateRoleMutation.isPending}
                            className="h-8 px-2.5 text-xs rounded-md border border-input bg-card text-foreground font-medium"
                          >
                            <option value="OWNER">Owner</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                          </select>
                        ) : (
                          getRoleBadge(member.role)
                        )}

                        {(isOwner || isAdmin) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={removeMemberMutation.isPending}
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to remove ${member.user.email} from this workspace?`
                                )
                              ) {
                                removeMemberMutation.mutate({ memberId: member.id });
                              }
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No members found for this workspace.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

