"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon,
  X,
  FileCheck2,
  Receipt
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadPaymentReceiptSchema, type UploadPaymentReceiptValues } from "~/lib/schemas/forms";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

interface UploadReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
  } | null;
  onSuccess?: () => void;
}

export function UploadReceiptModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: UploadReceiptModalProps) {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<UploadPaymentReceiptValues>({
    resolver: zodResolver(uploadPaymentReceiptSchema),
    defaultValues: {
      notes: "",
    },
  });

  const utils = api.useUtils();

  const submitMutation = api.portal.submitReceipt.useMutation({
    onSuccess: () => {
      utils.portal.getOverview.invalidate();
      utils.portal.getInvoices.invalidate();
      handleClose();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      alert(`Upload error: ${err.message}`);
    },
  });

  const handleClose = () => {
    setSelectedFile(null);
    form.reset();
    setFileError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size exceeds 5MB limit. Please upload a compressed PDF or image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        base64,
      });
    };
    reader.onerror = () => {
      setFileError("Failed to read the selected file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (values: UploadPaymentReceiptValues) => {
    if (!invoice || !selectedFile) return;

    submitMutation.mutate({
      invoiceId: invoice.id,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      fileData: selectedFile.base64,
      notes: values.notes?.trim() || "",
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border/80 bg-popover">
        <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Submit Payment Receipt
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Proof of bank remittance for statement verification
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Invoice Summary Banner */}
        <div className="px-5 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span>
          </div>
          <div className="font-mono font-bold text-sm text-foreground">
            {formatCurrency(invoice.totalAmount, invoice.currency)}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-5 space-y-4">
            {/* File Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Transfer Receipt Document <span className="text-destructive">*</span>
              </label>

              {!selectedFile ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all rounded-xl p-6 cursor-pointer group">
                  <div className="p-3 rounded-full bg-muted/80 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Click to browse or drop file here
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    Supports PDF, PNG, JPG (up to 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {selectedFile.type.includes("pdf") ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Attached
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setSelectedFile(null)}
                    className="text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {fileError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </p>
              )}
            </div>

            {/* Reference notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Payment Reference / Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="e.g. Wire transfer ref #84920 via Chase Bank"
                      className="text-xs resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px]" />
                </FormItem>
              )}
            />

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-2">
              <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <p>
                Upon submission, this invoice will enter{" "}
                <strong className="text-foreground">Payment Pending Verification</strong>. Once bank clearance is confirmed, the invoice is marked as Cleared.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={submitMutation.isPending}
                className="h-8 text-xs cursor-pointer border-border/80"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedFile || submitMutation.isPending}
                className="h-8 text-xs gap-1.5 cursor-pointer font-medium shadow-xs"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Submit Payment Proof</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
