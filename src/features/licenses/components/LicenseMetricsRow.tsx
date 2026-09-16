import { ShieldCheck, ShieldAlert, Activity, KeyRound } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

interface LicenseMetrics {
  active?: number;
  suspended?: number;
  totalChecks?: number;
  total?: number;
}

interface LicenseMetricsRowProps {
  metrics: LicenseMetrics | undefined;
  isLoading: boolean;
}

export function LicenseMetricsRow({ metrics, isLoading }: LicenseMetricsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Services */}
      <Card className="hover:border-border/80 transition-shadow">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Services</p>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono">
              {isLoading ? "..." : metrics?.active ?? 0}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">Healthy &amp; verifying</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Suspended / Kill-Switched */}
      <Card className="hover:border-border/80 transition-shadow">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kill-Switched</p>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono">
              {isLoading ? "..." : metrics?.suspended ?? 0}
            </p>
            <p className="text-xs text-destructive font-medium mt-1">
              {metrics?.suspended ? "Services halted" : "No active suspensions"}
            </p>
          </div>
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Total Verifications Today */}
      <Card className="hover:border-border/80 transition-shadow">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total API Pings</p>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono">
              {isLoading ? "..." : (metrics?.totalChecks ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All-time verifications</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* Issued Keys */}
      <Card className="hover:border-border/80 transition-shadow">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issued Keys</p>
            <p className="text-2xl font-bold text-foreground mt-1 font-mono">
              {isLoading ? "..." : metrics?.total ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All provisioned credentials</p>
          </div>
          <div className="p-3 bg-muted text-muted-foreground rounded-xl">
            <KeyRound className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
