"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendSignatureSchema, type SendSignatureValues } from "~/lib/schemas/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Send, Loader2, AlertCircle } from "lucide-react";

interface ContractForSigning {
  id: string;
  contractNumber: string;
  title: string;
  customer?: { name: string; email?: string | null } | null;
}

interface SendSignatureDialogProps {
  contract: ContractForSigning | null;
  onClose: () => void;
  onSubmit: (values: SendSignatureValues) => void;
  isPending: boolean;
}

export function SendSignatureDialog({
  contract,
  onClose,
  onSubmit,
  isPending,
}: SendSignatureDialogProps) {
  const form = useForm<SendSignatureValues>({
    resolver: zodResolver(sendSignatureSchema),
    defaultValues: {
      contractId: contract?.id ?? "",
      templateId: "",
    },
  });

  // Re-synchronize form values whenever a contract is selected
  useEffect(() => {
    if (contract) {
      form.reset({
        contractId: contract.id,
        templateId: "",
      });
    }
  }, [contract, form]);

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleFormSubmit = (values: SendSignatureValues) => {
    // Guarantees contractId is always populated from selected contract
    onSubmit({
      ...values,
      contractId: values.contractId || contract?.id || "",
    });
  };

  const hasFormErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <Dialog open={!!contract} onOpenChange={(open) => !open && !isPending && handleClose()}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            <span>Send Contract for e-Signature</span>
          </DialogTitle>
        </DialogHeader>

        {contract && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4 py-2 text-xs"
            >
              {/* Hidden contractId input to guarantee react-hook-form registration */}
              <input type="hidden" {...form.register("contractId")} value={contract.id} />

              <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="font-mono text-muted-foreground uppercase text-[10px]">Contract</span>
                  <span className="font-mono font-semibold text-foreground">{contract.contractNumber}</span>
                </div>
                <p className="font-bold text-sm text-foreground">{contract.title}</p>
                <p className="text-muted-foreground">
                  Recipient: <strong className="text-foreground">{contract.customer?.name}</strong>{" "}
                  ({contract.customer?.email || "No email"})
                </p>
              </div>

              {hasFormErrors && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {form.formState.errors.contractId?.message ||
                      form.formState.errors.templateId?.message ||
                      "Please correct the error before submitting."}
                  </span>
                </div>
              )}

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DocuSeal Template ID (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 12345 or template slug (leave blank for dynamic agreement)"
                        className="font-mono text-xs"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter your DocuSeal template ID (defaults to template #3 if left blank). An official signing invitation will be sent directly to the client via email (Resend).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating &amp; Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Signing Link via Email</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

