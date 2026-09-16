"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContractSchema, type CreateContractValues } from "~/lib/schemas/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { FileSignature } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
}

interface CreateContractDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateContractValues) => void;
  isPending: boolean;
  customers?: Customer[];
  defaultCustomerId?: string;
}

export function CreateContractDialog({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  customers,
  defaultCustomerId,
}: CreateContractDialogProps) {
  const form = useForm<CreateContractValues>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      customerId: defaultCustomerId ?? "",
      title: "",
      value: 0,
      currency: "USD",
      billingCycle: "MONTHLY",
      status: "DRAFT",
      terms: "",
      notes: "",
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
            <FileSignature className="w-5 h-5 text-primary" />
            <span>Create New Client Contract</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Client *</FormLabel>
                  <FormControl>
                    <NativeSelect className="w-full" {...field} disabled={!!defaultCustomerId}>
                      <NativeSelectOption value="">Select a client...</NativeSelectOption>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Platform SaaS Subscription & Technical Support"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Value *</FormLabel>
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
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <FormControl>
                      <NativeSelect className="w-full" {...field}>
                        <NativeSelectOption value="MONTHLY">Monthly</NativeSelectOption>
                        <NativeSelectOption value="QUARTERLY">Quarterly</NativeSelectOption>
                        <NativeSelectOption value="ANNUALLY">Annually</NativeSelectOption>
                        <NativeSelectOption value="ONE_TIME">One-Time</NativeSelectOption>
                      </NativeSelect>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Execution Mode</FormLabel>
                  <FormControl>
                    <NativeSelect className="w-full" {...field}>
                      <NativeSelectOption value="DRAFT">
                        Draft — Send for e-Signature via DocuSeal (Recommended)
                      </NativeSelectOption>
                      <NativeSelectOption value="ACTIVE">
                        Active — Pre-signed or Direct Activation
                      </NativeSelectOption>
                    </NativeSelect>
                  </FormControl>
                  <FormDescription>
                    Draft agreements can be dispatched to DocuSeal and signed digitally by the client.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms &amp; Commitments</FormLabel>
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
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Creating..." : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
