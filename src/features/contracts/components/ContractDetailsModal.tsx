"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { FileSignature, FileText, ExternalLink, Send, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { ContractStatusBadge } from "./ContractStatusBadge";

interface ContractDetailsModalProps {
  contract: any | null;
  onClose: () => void;
  onDispatchSign: (contract: any) => void;
  onSyncStatus: (contractId: string, e?: React.MouseEvent) => void;
  syncingContractId: string | null;
}

export function ContractDetailsModal({
  contract,
  onClose,
  onDispatchSign,
  onSyncStatus,
  syncingContractId,
}: ContractDetailsModalProps) {
  return (
    <Dialog open={!!contract} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            <span>Contract Execution Details</span>
          </DialogTitle>
        </DialogHeader>

        {contract && (
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-xl">
              <div>
                <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-wider">
                  {contract.contractNumber}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {contract.title}
                </p>
                <p className="text-xs text-primary font-medium mt-0.5">
                  {contract.customer?.name}
                </p>
              </div>
              <div>
                <ContractStatusBadge
                  status={contract.status}
                  signedAt={contract.signedAt}
                  submissionId={contract.submissionId}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border rounded-xl font-mono">
              <div>
                <span className="text-muted-foreground text-[10px] uppercase">Value &amp; Interval</span>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {formatCurrency(contract.value, contract.currency)}{" "}
                  <span className="text-xs font-normal">/ {contract.billingCycle.toLowerCase()}</span>
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] uppercase">Effective Start</span>
                <p className="text-foreground mt-0.5">{formatDate(contract.startDate)}</p>
              </div>
              {contract.signedAt && (
                <div className="col-span-2 pt-1 border-t border-border">
                  <span className="text-muted-foreground text-[10px] uppercase">E-Signed Timestamp</span>
                  <p className="text-emerald-600 font-semibold mt-0.5">
                    {formatDate(contract.signedAt)}
                  </p>
                </div>
              )}
            </div>

            {contract.signedDocumentUrl && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-700">Executed Agreement PDF</p>
                    <p className="text-[10px] text-muted-foreground">Digitally signed via DocuSeal</p>
                  </div>
                </div>
                <a
                  href={contract.signedDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>View PDF</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {contract.terms && (
              <div>
                <p className="font-semibold text-foreground mb-1">Contract Commitments &amp; SLA Terms:</p>
                <p className="p-3 bg-card border border-border rounded-lg text-foreground leading-relaxed">
                  {contract.terms}
                </p>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2 sm:justify-between">
              <div className="flex items-center gap-2">
                {contract.status === "DRAFT" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDispatchSign(contract)}
                      className="gap-1.5 text-xs text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{contract.submissionId ? "Re-send e-Sign" : "Send for e-Signature"}</span>
                    </Button>
                    {contract.submissionId && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={syncingContractId === contract.id}
                        onClick={(e) => onSyncStatus(contract.id, e)}
                        className="gap-1.5 text-xs text-sky-600 border-sky-500/40 hover:bg-sky-500/10"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingContractId === contract.id ? "animate-spin" : ""}`} />
                        <span>Sync Status</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
