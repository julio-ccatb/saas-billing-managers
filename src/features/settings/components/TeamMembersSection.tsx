"use client";

import React, { useState } from "react";
import {
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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { useCompany } from "~/components/company/CompanyContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addMemberSchema,
  type AddMemberValues,
} from "~/lib/schemas/forms";

export function TeamMembersSection() {
  const { activeCompany } = useCompany();
  const utils = api.useUtils();

  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const memberForm = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const { data: members, isLoading: isMembersLoading } = api.company.getMembers.useQuery();

  const addMemberMutation = api.company.addMember.useMutation({
    onSuccess: () => {
      setMemberSuccess("Member added to workspace.");
      memberForm.reset();
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

  const handleAddMember = (values: AddMemberValues) => {
    setMemberError(null);
    addMemberMutation.mutate(values);
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

  return (
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
        <Form {...memberForm}>
          <form onSubmit={memberForm.handleSubmit(handleAddMember)} className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Invite or Add Team Member</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <FormField
                control={memberForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        disabled={addMemberMutation.isPending}
                        className="h-9 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={memberForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <NativeSelect
                        disabled={addMemberMutation.isPending}
                        className="h-9 text-xs"
                        {...field}
                      >
                        <NativeSelectOption value="MEMBER">Member (Read &amp; Create)</NativeSelectOption>
                        <NativeSelectOption value="ADMIN">Admin (Full Management)</NativeSelectOption>
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                <span>Invite Member</span>
              </Button>
            </div>
          </form>
        </Form>
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
                      className="text-xs h-8 px-2 rounded-md border border-border bg-background text-foreground focus:outline-hidden"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  ) : (
                    getRoleBadge(member.role)
                  )}

                  {isOwner && member.role !== "OWNER" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remove ${member.user.name || member.user.email} from workspace?`)) {
                          removeMemberMutation.mutate({ memberId: member.id });
                        }
                      }}
                      disabled={removeMemberMutation.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No team members found.
          </div>
        )}
      </div>
    </Card>
  );
}
