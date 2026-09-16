"use client";

import { FileSignature, Plus, Send, RefreshCw, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { ContractStatusBadge } from "~/features/contracts/components/ContractStatusBadge";

interface CustomerContractsSectionProps {
  contracts?: any[];
  onAddContract: () => void;
  onDispatchSign: (contract: any) => void;
  onSyncStatus: (contractId: string, e?: React.MouseEvent) => void;
  onTerminate: (contractId: string) => void;
  syncingContractId: string | null;
}

export function CustomerContractsSection({
  contracts,
  onAddContract,
  onDispatchSign,
  onSyncStatus,
  onTerminate,
  syncingContractId,
}: CustomerContractsSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-primary" />
            <span>Client Contracts &amp; Subscriptions</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Legally binding commitments, billing intervals, and SLA terms
          </p>
        </div>
        <Button
          onClick={onAddContract}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Contract</span>
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-5">Contract #</th>
              <th className="py-3 px-5">Title</th>
              <th className="py-3 px-5">Billing Cycle</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Effective Date</th>
              <th className="py-3 px-5 text-right">Value</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!contracts || contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No contracts recorded for this client. Create a contract to establish recurring billing.
                </td>
              </tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                    {c.contractNumber}
                  </td>
                  <td className="py-3.5 px-5 font-medium text-foreground text-xs sm:text-sm">
                    {c.title}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {c.billingCycle}
                  </td>
                  <td className="py-3.5 px-5">
                    <ContractStatusBadge
                      status={c.status}
                      signedAt={c.signedAt}
                      submissionId={c.submissionId}
                    />
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {formatDate(c.startDate)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-foreground text-xs sm:text-sm">
                    {formatCurrency(c.value, c.currency)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === "DRAFT" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDispatchSign(c)}
                            className="text-xs h-7 px-2.5 gap-1 text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                          >
                            <Send className="w-3 h-3" />
                            <span>{c.submissionId ? "Re-send" : "Send e-Sign"}</span>
                          </Button>
                          {c.submissionId && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={syncingContractId === c.id}
                              onClick={(e) => onSyncStatus(c.id, e)}
                              className="text-xs h-7 px-2 gap-1 text-sky-600 border-sky-500/40 hover:bg-sky-500/10"
                              title="Sync status directly from DocuSeal (Zero-tunnel)"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncingContractId === c.id ? "animate-spin" : ""}`} />
                              <span>Sync</span>
                            </Button>
                          )}
                        </>
                      )}
                      {c.status === "ACTIVE" && c.signedDocumentUrl && (
                        <a
                          href={c.signedDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs h-7 px-2 rounded-md border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 transition-colors font-medium"
                          title="View/Download executed agreement PDF"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      )}
                      {c.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onTerminate(c.id)}
                          className="text-xs h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
