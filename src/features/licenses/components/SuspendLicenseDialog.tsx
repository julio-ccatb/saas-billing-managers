"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  guardrailSuspensionSchema,
  type GuardrailSuspensionValues,
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
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface SuspendLicenseDialogProps {
  license: any | null;
  onClose: () => void;
  onSuspend: (values: GuardrailSuspensionValues) => void;
  isPending: boolean;
}

export function SuspendLicenseDialog({
  license,
  onClose,
  onSuspend,
  isPending,
}: SuspendLicenseDialogProps) {
  const form = useForm<GuardrailSuspensionValues>({
    resolver: zodResolver(guardrailSuspensionSchema),
    defaultValues: {
      reason: "",
      suspensionNotice:
        license?.suspensionNotice ||
        "Service temporarily suspended by administrator. Please contact billing to restore access.",
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={!!license} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" />
            <span>Service Kill-Switch Guardrail</span>
          </DialogTitle>
        </DialogHeader>

        {license && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSuspend)} className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-destructive font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Immediate Remote Suspension Warning</span>
                </div>
                <p className="text-destructive/90 leading-relaxed">
                  Executing this action will immediately revoke service access for{" "}
                  <strong>{license.name}</strong>. Ongoing API calls and client application heartbeats will fail.
                </p>
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Audit Rationale *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Overdue invoice #INV-2024-001 past 30 days"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This reason will be immutably recorded in the security audit ledger.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suspensionNotice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client-Facing Suspension Notice</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Message displayed to end users when accessing the service..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                >
                  {isPending ? "Suspending..." : "Confirm Remote Kill-Switch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
