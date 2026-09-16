"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerPortalAccessSchema,
  type CustomerPortalAccessValues,
} from "~/lib/schemas/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { KeyRound, Mail, Send, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";

interface PortalAccessDialogProps {
  customer: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CustomerPortalAccessValues) => void;
  isPending: boolean;
  onResendInvite?: () => void;
  isResending?: boolean;
}

export function PortalAccessDialog({
  customer,
  isOpen,
  onClose,
  onSubmit,
  isPending,
  onResendInvite,
  isResending = false,
}: PortalAccessDialogProps) {
  const form = useForm<CustomerPortalAccessValues>({
    resolver: zodResolver(customerPortalAccessSchema),
    defaultValues: {
      email: customer?.clientUser?.email || customer?.email || "",
      password: "",
      portalEnabled: customer?.portalEnabled ?? true,
      sendInviteEmail: true,
    },
  });

  useEffect(() => {
    if (customer && isOpen) {
      form.reset({
        email: customer.clientUser?.email || customer.email || "",
        password: "",
        portalEnabled: customer.portalEnabled ?? true,
        sendInviteEmail: true,
      });
    }
  }, [customer, isOpen, form]);

  const portalEnabled = form.watch("portalEnabled");
  const sendInviteEmail = form.watch("sendInviteEmail");

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <span>Client Portal Access Management</span>
          </DialogTitle>
        </DialogHeader>

        {customer && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl space-y-1">
                <p className="font-semibold text-foreground">Self-Service Access for {customer.name}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Allows client stakeholders to review billing history, submit wire receipts, and view license heartbeat health.
                </p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Login Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="billing@client.com" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      The corporate email address where login notifications and portal credentials are tied.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Portal Account State Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div>
                  <p className="font-semibold text-foreground text-xs">Portal Account State</p>
                  <p className="text-[11px] text-muted-foreground">
                    Instantly permit or revoke portal sign-in
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="portalEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Send Password Setup Email Toggle (Visible when portal is enabled) */}
              {portalEnabled && (
                <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>Send Password Setup Link</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Emails a secure 24-hour link for the client to set their password
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="sendInviteEmail"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {sendInviteEmail && (
                    <div className="p-2 rounded bg-primary/5 border border-primary/10 text-[11px] text-primary flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        The client will receive an automated onboarding email containing a secure link to choose their password and sign in directly.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Manual Password Override */}
              {portalEnabled && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-normal">
                        Manual Password Override <span className="text-[10px]">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Leave blank to invite via email"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Leave blank if you want the client to define their own password via the email link.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Resend setup link button if portal is currently active */}
              {customer.portalEnabled && onResendInvite && (
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">Need to re-invite?</p>
                    <p className="text-[10px] text-muted-foreground">Dispatch a fresh password setup email</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onResendInvite}
                    disabled={isResending}
                    className="gap-1.5 text-xs h-8"
                  >
                    {isResending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span>{isResending ? "Sending..." : "Resend Setup Email"}</span>
                  </Button>
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Saving..." : "Update Portal Access"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

