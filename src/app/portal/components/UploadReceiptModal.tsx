"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon,
  X
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const [notes, setNotes] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);

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
    setNotes("");
    setFileError(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size exceeds 5MB. Please upload a compressed PDF or image.");
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
      setFileError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !selectedFile) return;

    submitMutation.mutate({
      invoiceId: invoice.id,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      mimeType: selectedFile.type,
      fileData: selectedFile.base64,
      notes: notes.trim(),
    });
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <span>Submit Payment Receipt</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Attach proof of payment for Invoice{" "}
            <span className="font-mono font-semibold text-foreground">
              {invoice.invoiceNumber}
            </span>{" "}
            ({formatCurrency(invoice.totalAmount, invoice.currency)}).
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* File Picker Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Receipt File (PNG, JPG, or PDF max 5MB)
            </label>

            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors rounded-xl p-6 cursor-pointer group">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <span className="text-xs font-semibold text-foreground">Click to upload payment proof</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Supports PDF, PNG, JPG</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {selectedFile.type.includes("pdf") ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {fileError && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fileError}</span>
              </p>
            )}
          </div>

          {/* Transfer reference / notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Reference / Notes (Optional)
            </label>
            <Textarea
              rows={2}
              placeholder="e.g. Wire transfer ref #84920 via Chase Bank on Sept 14"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Verification Notice:</p>
            <p>
              Once submitted, this invoice status will update to{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                Payment Pending Verification
              </span>
              . Our billing department will verify the bank funds and mark your invoice as fully Paid.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedFile || submitMutation.isPending}
              className="gap-1.5"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Receipt...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit for Verification</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
