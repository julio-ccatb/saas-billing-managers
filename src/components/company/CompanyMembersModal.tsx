"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { useCompany } from "./CompanyContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import {
  ShieldAlert,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export function CompanyMembersModal() {
  const { isMembersModalOpen, setIsMembersModalOpen, activeCompany } = useCompany();
  const utils = api.useUtils();

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: members, isLoading } = api.company.getMembers.useQuery(undefined, {
    enabled: isMembersModalOpen,
  });

  const addMemberMutation = api.company.addMember.useMutation({
    onSuccess: () => {
      setSuccessMessage("Member added to workspace successfully.");
      setNewEmail("");
      setErrorMessage(null);
      void utils.company.getMembers.invalidate();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setSuccessMessage(null);
    },
  });

  const updateRoleMutation = api.company.updateMemberRole.useMutation({
    onSuccess: () => {
      setSuccessMessage("Member role updated.");
      setErrorMessage(null);
      void utils.company.getMembers.invalidate();
      void utils.company.list.invalidate();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setSuccessMessage(null);
    },
  });

  const removeMemberMutation = api.company.removeMember.useMutation({
    onSuccess: () => {
      setSuccessMessage("Member removed from workspace.");
      setErrorMessage(null);
      void utils.company.getMembers.invalidate();
      void utils.company.list.invalidate();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setErrorMessage(err.message);
      setSuccessMessage(null);
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setErrorMessage(null);
    addMemberMutation.mutate({
      email: newEmail.trim().toLowerCase(),
      role: newRole,
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

  const isOwner = activeCompany?.role === "OWNER";

  return (
    <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Workspace Members
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manage access and roles for <span className="font-semibold text-foreground">{activeCompany?.name}</span>
              </DialogDescription>
            </div>
            {activeCompany?.role && (
              <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                Your role: {activeCompany.role}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Add Member Form (available to Owner & Admin) */}
          {(isOwner || activeCompany?.role === "ADMIN") && (
            <form onSubmit={handleAddMember} className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Add New Member</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={addMemberMutation.isPending}
                  className="h-9 text-xs flex-1"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "ADMIN" | "MEMBER")}
                  disabled={addMemberMutation.isPending}
                  className="h-9 px-2.5 rounded-lg border border-input bg-card text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-ring"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
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
              <span>Member ({members?.length || 0})</span>
              <span>Role / Actions</span>
            </div>

            {isLoading ? (
              <div className="py-8 flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading workspace members...</span>
              </div>
            ) : members && members.length > 0 ? (
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
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
                          className="h-7 px-2 text-xs rounded-md border border-input bg-card text-foreground font-medium"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </select>
                      ) : (
                        getRoleBadge(member.role)
                      )}

                      {(isOwner || activeCompany?.role === "ADMIN") && (
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
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                No members found for this company.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
