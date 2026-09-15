"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Mail, Send, Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react";

export interface SendInvoiceModalProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    receiverName: string;
    receiverEmail?: string | null;
    totalAmount: number;
    currency: string;
    dueDate: Date | string;
    status: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { recipientEmail: string; customMessage?: string }) => Promise<void> | void;
  isSending?: boolean;
}

export function SendInvoiceModal({
  invoice,
  isOpen,
  onClose,
  onSend,
  isSending = false,
}: SendInvoiceModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      setRecipientEmail(invoice.receiverEmail || "");
      setCustomMessage("");
      setErrorMessage(null);
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setErrorMessage("Please provide a valid recipient email address.");
      return;
    }
    setErrorMessage(null);
    onSend({
      recipientEmail: recipientEmail.trim(),
      customMessage: customMessage.trim() ? customMessage.trim() : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 px-6 py-5 border-b border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-bold text-base">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Email Invoice to Client
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              An email with an attached PDF of invoice{" "}
              <strong className="text-foreground font-mono">{invoice.invoiceNumber}</strong>{" "}
              will be dispatched via Resend.
            </p>
          </DialogHeader>
        </div>

        {/* Invoice Mini Card */}
        <div className="px-6 pt-4">
          <div className="bg-muted/40 border border-border rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block">Client:</span>
              <span className="font-semibold text-foreground">{invoice.receiverName}</span>
            </div>
            <div className="text-right space-y-0.5">
              <span className="text-muted-foreground block">Balance Due:</span>
              <span className="font-bold text-foreground font-mono text-sm">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 text-sm">
          {errorMessage && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Recipient Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              required
              placeholder="billing@clientcompany.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={isSending}
              className="h-10 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Custom Message / Memo (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please find the monthly statement attached. Thank you for your continued partnership!"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={isSending}
              className="w-full px-3 py-2 border border-input rounded-lg bg-card text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Attachment Preview Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">
              Attachment: <span className="font-mono text-foreground font-semibold">invoice-{invoice.invoiceNumber}.pdf</span>
            </span>
          </div>

          <DialogFooter className="pt-3 border-t border-border flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending}
              className="w-full sm:w-auto gap-1.5 font-semibold"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending via Resend...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invoice</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
