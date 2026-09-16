import { CheckCircle2 } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { formatDate } from "~/lib/utils/format";

interface ContractStatusBadgeProps {
  status: string;
  signedAt?: Date | string | null;
  submissionId?: string | number | null;
}

export function ContractStatusBadge({ status, signedAt, submissionId }: ContractStatusBadgeProps) {
  if (status === "DRAFT") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-600 border border-amber-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>Awaiting Signature</span>
        </span>
        {submissionId ? (
          <span className="text-[10px] font-mono text-muted-foreground">DocuSeal #{submissionId}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground">Unsent</span>
        )}
      </div>
    );
  }

  if (status === "ACTIVE") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>Active &amp; Signed</span>
        </span>
        {signedAt && (
          <span className="text-[10px] font-mono text-muted-foreground">
            Signed: {formatDate(signedAt)}
          </span>
        )}
      </div>
    );
  }

  if (status === "TERMINATED") {
    return <Badge variant="destructive">Terminated</Badge>;
  }

  return <Badge variant="secondary">{status}</Badge>;
}
