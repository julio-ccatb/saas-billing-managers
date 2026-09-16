"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLicenseSchema,
  type CreateLicenseValues,
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
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { KeyRound } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
}

interface LicenseUpsertDialogProps {
  isOpen: boolean;
  editingLicense: any | null;
  customers?: Customer[];
  onClose: () => void;
  onSubmit: (values: CreateLicenseValues) => void;
  isPending: boolean;
}

export function LicenseUpsertDialog({
  isOpen,
  editingLicense,
  customers,
  onClose,
  onSubmit,
  isPending,
}: LicenseUpsertDialogProps) {
  const form = useForm<CreateLicenseValues>({
    resolver: zodResolver(createLicenseSchema),
    defaultValues: {
      name: editingLicense?.name || "",
      customerId: editingLicense?.customerId || "",
      allowedDomain: editingLicense?.allowedDomain || "",
      suspensionNotice:
        editingLicense?.suspensionNotice ||
        "Service temporarily suspended by administrator. Please contact billing to restore access.",
      leaseTtlMinutes: editingLicense?.leaseTtlMinutes || 60,
      gracePeriodHours: editingLicense?.gracePeriodHours || 3,
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <span>{editingLicense ? "Configure License Service" : "Issue New License"}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service / Application Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Enterprise CRM Instance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Customer</FormLabel>
                  <FormControl>
                    <NativeSelect className="w-full" {...field}>
                      <NativeSelectOption value="">Internal / Unassigned</NativeSelectOption>
                      {customers?.map((c) => (
                        <NativeSelectOption key={c.id} value={c.id}>
                          {c.name} {c.email ? `(${c.email})` : ""}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowedDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed Domain / Origin Lock</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. app.clientdomain.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Restricts heartbeat validation strictly to this FQDN.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="leaseTtlMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lease TTL (Minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min={5} max={1440} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gracePeriodHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace Period (Hours)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={720} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="suspensionNotice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Suspension Notice</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : editingLicense
                  ? "Update Configuration"
                  : "Generate License"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
