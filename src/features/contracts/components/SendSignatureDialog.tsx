"use client";

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
import { Send } from "lucide-react";

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

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={!!contract} onOpenChange={(open) => !open && handleClose()}>
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
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-2 text-xs"
            >
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
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the ID or slug of your DocuSeal template. If left blank, our dynamic contract document generator will be used.
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
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPending ? "Connecting to DocuSeal..." : "Dispatch to DocuSeal"}</span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
