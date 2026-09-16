import { TrendingUp, CheckCircle2, FileSignature, Clock } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { formatCurrency } from "~/lib/utils/format";

interface ContractMetrics {
  estimatedMRR?: number;
  activeCount?: number;
  totalContracts?: number;
  totalActiveValue?: number;
  draftCount?: number;
  terminatedCount?: number;
}

interface ContractMetricsRowProps {
  metrics: ContractMetrics | undefined;
  isLoading: boolean;
}

export function ContractMetricsRow({ metrics, isLoading }: ContractMetricsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Contract MRR
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {isLoading ? "..." : formatCurrency(metrics?.estimatedMRR ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground pt-0.5 font-mono">
              ARR: {formatCurrency((metrics?.estimatedMRR ?? 0) * 12)}
            </p>
          </div>
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Contracts
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {isLoading ? "..." : metrics?.activeCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground pt-0.5">
              Total commitments: {metrics?.totalContracts ?? 0}
            </p>
          </div>
          <div className="p-2.5 bg-secondary text-secondary-foreground rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Active Value
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {isLoading ? "..." : formatCurrency(metrics?.totalActiveValue ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground pt-0.5 font-mono">Cumulative contract book</p>
          </div>
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <FileSignature className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status Breakdown
            </p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {isLoading ? "..." : metrics?.draftCount ?? 0}
              <span className="text-xs font-normal text-muted-foreground ml-1">drafts</span>
            </p>
            <p className="text-xs text-muted-foreground pt-0.5">
              {metrics?.terminatedCount ?? 0} terminated
            </p>
          </div>
          <div className="p-2.5 bg-muted text-muted-foreground rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
