"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import {
  Check,
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Loader2,
  Calendar,
  Building2,
  FileCheck,
  MessageSquareQuote,
  Clock,
  ChevronDown,
} from "lucide-react";

export interface VerifyPaymentProofModalProps {
  receipt: {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileData: string;
    notes?: string | null;
    status: string;
    createdAt: Date | string;
    invoice?: {
      id: string;
      invoiceNumber: string;
      receiverName: string;
      receiverEmail?: string | null;
      totalAmount: number;
      currency: string;
      dueDate: Date | string;
      issueDate?: Date | string;
      bankName?: string | null;
      bankAccountNumber?: string | null;
    } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (receiptId: string) => Promise<void> | void;
  onReject: (receiptId: string, reason: string) => Promise<void> | void;
  isProcessing?: boolean;
}

const QUICK_REASONS = [
  "Amount mismatch with invoice total",
  "Illegible or cropped transaction slip",
  "Reference not found in bank account",
  "Sender name does not match client record",
] as const;

export function VerifyPaymentProofModal({
  receipt,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isProcessing = false,
}: VerifyPaymentProofModalProps) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPending, startTransition] = useTransition();

  if (!receipt) return null;

  const invoice = receipt.invoice;
  const isPdf =
    receipt.mimeType?.includes("pdf") ||
    receipt.fileName.toLowerCase().endsWith(".pdf");
  const isBusy = isProcessing || isPending;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = receipt.fileData;
    link.download = receipt.fileName || "payment-proof";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    try {
      const win = window.open();
      if (win) {
        if (isPdf) {
          win.document.write(
            `<iframe src="${receipt.fileData}" style="position:fixed;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;margin:0;padding:0;overflow:hidden;"></iframe>`
          );
        } else {
          win.document.write(
            `<html><body style="margin:0;background:#09090b;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${receipt.fileData}" style="max-width:95vw;max-height:95vh;object-fit:contain;" /></body></html>`
          );
        }
      }
    } catch {
      window.open(receipt.fileData, "_blank");
    }
  };

  const handleApprove = () => {
    setError(null);
    startTransition(() => {
      onApprove(receipt.id);
    });
  };

  const handleReject = () => {
    if (!reason.trim()) {
      setError("Please write a reason so the client knows why it was rejected.");
      return;
    }
    setError(null);
    startTransition(() => {
      onReject(receipt.id, reason.trim());
    });
  };

  const handleClose = () => {
    if (!isBusy) {
      setIsRejecting(false);
      setShowMoreDetails(false);
      setReason("");
      setError(null);
      handleResetView();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-6 gap-3.5">
        {/* Polished Executive Header */}
        <DialogHeader className="space-y-3 pb-1 border-b border-border/80">
          <div className="flex items-start justify-between gap-4 pr-7">
            {/* Title & Status */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-bold tracking-tight text-foreground font-heading">
                  Verify Payment Proof
                </DialogTitle>
                {invoice && (
                  <Badge variant="outline" className="font-mono text-xs tabular-nums font-semibold px-2 py-0.5">
                    {invoice.invoiceNumber}
                  </Badge>
                )}
                <Badge variant="verification" className="text-xs gap-1 font-medium">
                  <Clock className="size-3" aria-hidden="true" />
                  <span>Pending</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review submitted transaction slip before updating ledger status.
              </p>
            </div>

            {/* Total Amount Focus Hero */}
            {invoice && (
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Amount Due
                </span>
                <span className="text-xl font-bold font-mono text-foreground tracking-tight tabular-nums block mt-0.5">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
            )}
          </div>

          {/* Quick Context Strip */}
          <div className="flex items-center justify-between gap-3 text-xs bg-muted/40 rounded-lg px-3.5 py-2 text-muted-foreground">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <Building2 className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                <span className="font-medium text-foreground truncate max-w-[200px]" title={invoice?.receiverName}>
                  {invoice?.receiverName || "Client"}
                </span>
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                <span>Due: {invoice ? formatDate(invoice.dueDate) : "—"}</span>
              </span>
            </div>

            {/* Toggle for Extended Metadata */}
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>{showMoreDetails ? "Less details" : "More details"}</span>
              <ChevronDown
                className={`size-3 transition-transform duration-150 ${showMoreDetails ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Extended Details Drawer */}
          {showMoreDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-muted/20 border border-border/80 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Client Email</span>
                <span className="text-foreground truncate block mt-0.5 font-medium">
                  {invoice?.receiverEmail || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Target Bank</span>
                <span className="text-foreground truncate block mt-0.5 font-medium">
                  {invoice?.bankName || "Primary Account"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Uploaded Date</span>
                <span className="font-mono text-muted-foreground text-[11px] block mt-0.5 tabular-nums">
                  {formatDate(receipt.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">File Format</span>
                <span className="font-mono text-muted-foreground text-[11px] block mt-0.5 uppercase">
                  {receipt.mimeType.split("/")[1] || "IMG"}
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Document Preview Box with Utilities */}
        <div className="flex-1 min-h-[290px] max-h-[440px] flex flex-col rounded-lg border border-border bg-muted/10 overflow-hidden">
          {/* File Header Bar with Integrated Zoom Controls */}
          <div className="px-3.5 py-1.5 border-b border-border bg-card/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <FileCheck className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[200px] sm:max-w-[320px] font-mono font-medium text-foreground text-xs" title={receipt.fileName}>
                {receipt.fileName}
              </span>
              <span className="tabular-nums text-[11px] text-muted-foreground">
                ({(receipt.fileSize / 1024).toFixed(1)}&nbsp;KB)
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!isPdf && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    title="Zoom out"
                    className="size-7"
                  >
                    <ZoomOut className="size-3.5" />
                  </Button>
                  <button
                    type="button"
                    onClick={handleResetView}
                    title="Reset zoom"
                    className="px-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer tabular-nums"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                    title="Zoom in"
                    className="size-7"
                  >
                    <ZoomIn className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleRotate}
                    title="Rotate clockwise"
                    className="size-7"
                  >
                    <RotateCw className="size-3.5" />
                  </Button>
                  <div className="h-4 w-px bg-border mx-1" />
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleDownload}
                className="h-7 px-2 text-xs gap-1"
                title="Download original file"
              >
                <Download className="size-3" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleOpenNewTab}
                className="h-7 px-2 text-xs gap-1"
                title="Open in new window"
              >
                <ExternalLink className="size-3" />
                <span className="hidden sm:inline">Open</span>
              </Button>
            </div>
          </div>

          {/* Main Viewer Canvas */}
          <div className="flex-1 overflow-auto p-3 flex items-center justify-center relative bg-black/[0.02] dark:bg-black/20">
            {isPdf ? (
              <iframe
                src={receipt.fileData}
                className="w-full h-full min-h-[250px] rounded border-none"
                title="Receipt PDF"
              />
            ) : (
              <div
                className="max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={receipt.fileData}
                  alt={receipt.fileName}
                  className="max-h-[360px] max-w-full object-contain rounded shadow-xs"
                />
              </div>
            )}
          </div>

          {/* Client Note Section with Distinct Visual Treatment */}
          {receipt.notes && (
            <div className="px-3.5 py-2 border-t border-border bg-card/90 text-xs flex items-center gap-2">
              <MessageSquareQuote className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="font-semibold text-foreground shrink-0">Client Note:</span>
              <span className="italic text-muted-foreground truncate">“{receipt.notes}”</span>
            </div>
          )}
        </div>

        {/* Rejection Drawer */}
        {isRejecting && (
          <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-destructive">
                Reason for Rejection (required):
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(false);
                  setError(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Quick 1-Click Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setReason(chip);
                    if (error) setError(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer text-left ${
                    reason === chip
                      ? "border-destructive bg-destructive text-destructive-foreground font-medium"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            <Textarea
              rows={2}
              placeholder="Additional details for client..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              className="text-xs resize-none bg-background border-border"
              disabled={isBusy}
              autoFocus
            />
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isBusy}
            className="text-xs h-9"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {!isRejecting ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejecting(true)}
                  disabled={isBusy}
                  className="text-xs h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <X className="size-4 mr-1" />
                  <span>Reject</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isBusy}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isBusy ? (
                    <Loader2 className="size-4 animate-spin mr-1" />
                  ) : (
                    <Check className="size-4 mr-1" />
                  )}
                  <span>Approve &amp; Mark Paid</span>
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={isBusy}
                className="text-xs h-9"
              >
                {isBusy ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                <span>Confirm Rejection</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
