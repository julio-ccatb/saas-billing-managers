import { Badge } from "~/components/ui/badge";

export function InvoiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PAID":
      return <Badge variant="success">Paid</Badge>;
    case "OVERDUE":
      return <Badge variant="destructive">Overdue</Badge>;
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "PAYMENT_PENDING_VERIFICATION":
      return <Badge variant="verification">Verification Pending</Badge>;
    default:
      return <Badge variant="warning">Pending</Badge>;
  }
}
