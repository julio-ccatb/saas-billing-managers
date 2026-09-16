import { Badge } from "~/components/ui/badge";

export function AuditActionBadge({ action }: { action: string }) {
  switch (action) {
    case "SERVICE_SUSPENDED":
      return <Badge variant="destructive">Service Suspended</Badge>;
    case "SERVICE_ACTIVATED":
      return <Badge variant="success">Service Activated</Badge>;
    case "SERVICE_DELETED":
      return <Badge variant="destructive">Service Deleted</Badge>;
    case "KEY_REGENERATED":
      return <Badge variant="warning">Key Rotated</Badge>;
    case "CONTRACT_CREATED":
      return <Badge variant="secondary">Contract Created</Badge>;
    case "CONTRACT_TERMINATED":
      return <Badge variant="destructive">Contract Terminated</Badge>;
    case "BILLING_OVERRIDE":
      return <Badge variant="outline">Billing Override</Badge>;
    case "CUSTOMER_DELETED":
      return <Badge variant="destructive">Customer Deleted</Badge>;
    default:
      return <Badge variant="secondary">{action.replace(/_/g, " ")}</Badge>;
  }
}
