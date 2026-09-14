import type { PrismaClient } from "../../../../generated/prisma";

export type AuditAction =
  | "CLIENT_ONBOARDED"
  | "SERVICE_SUSPENDED"
  | "SERVICE_ACTIVATED"
  | "KEY_REGENERATED"
  | "SERVICE_DELETED"
  | "CONTRACT_CREATED"
  | "CONTRACT_UPDATED"
  | "CONTRACT_TERMINATED"
  | "CONTRACT_SIGNED"
  | "BILLING_OVERRIDE"
  | "INVOICE_STATUS_UPDATED"
  | "CUSTOMER_DELETED";

export type AuditEntityType = "LICENSE" | "CONTRACT" | "INVOICE" | "CUSTOMER";

export interface RecordAuditParams {
  userId: string;
  operatorId: string;
  action: AuditAction | (string & {});
  entityType: AuditEntityType | (string & {});
  entityId: string;
  reason: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Writes an immutable audit entry to the AuditLog table.
 * Mandatory for destructive actions, kill-switches, and billing status overrides.
 */
export async function recordAuditLog(
  db: PrismaClient,
  params: RecordAuditParams
) {
  return db.auditLog.create({
    data: {
      userId: params.userId,
      operatorId: params.operatorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      reason: params.reason,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress ?? null,
    },
  });
}
