"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AlertTriangle } from "lucide-react";

interface TerminateContractDialogProps {
  contractId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTerminate: (contractId: string, reason: string) => void;
  isPending: boolean;
}

export function TerminateContractDialog({
  contractId,
  isOpen,
  onClose,
  onTerminate,
  isPending,
}: TerminateContractDialogProps) {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (!contractId || reason.trim().length < 3) return;
    onTerminate(contractId, reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md border-border">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Terminate Contract</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs">
            Terminated contracts are permanently locked as immutable historical records and will cease contributing to active MRR calculations.
          </p>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Termination Reason (Mandatory) *
            </label>
            <Input
              required
              placeholder="e.g. Mutual termination agreement / Non-payment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={reason.trim().length < 3 || isPending}
            onClick={handleConfirm}
          >
            {isPending ? "Terminating..." : "Terminate Contract"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
