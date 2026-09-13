import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { generateLicenseKey } from "./keygen";
import { recordAuditLog } from "~/features/audit/server/auditService";

export const licenseRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "REVOKED"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const search = input?.search?.trim();
      const statusFilter = input?.status && input.status !== "ALL" ? input.status : undefined;

      const where: any = { userId };
      if (statusFilter) {
        where.status = statusFilter;
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { key: { contains: search } },
          { allowedDomain: { contains: search } },
          { customer: { name: { contains: search } } },
        ];
      }

      return ctx.db.license.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const licenses = await ctx.db.license.findMany({
      where: { userId },
      select: {
        status: true,
        checkCount: true,
      },
    });

    const total = licenses.length;
    let active = 0;
    let suspended = 0;
    let revoked = 0;
    let totalChecks = 0;

    for (const lic of licenses) {
      if (lic.status === "ACTIVE") active++;
      else if (lic.status === "SUSPENDED") suspended++;
      else if (lic.status === "REVOKED") revoked++;

      totalChecks += lic.checkCount || 0;
    }

    return {
      total,
      active,
      suspended,
      revoked,
      totalChecks,
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const license = await ctx.db.license.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
        },
      });

      if (!license || license.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "License not found",
        });
      }

      return license;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Service name is required"),
        customerId: z.string().optional().nullable(),
        allowedDomain: z.string().optional().nullable(),
        suspensionNotice: z.string().optional().nullable(),
        leaseTtlMinutes: z.number().min(5).max(1440).default(60),
        gracePeriodHours: z.number().min(1).max(72).default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const key = generateLicenseKey();

      return ctx.db.license.create({
        data: {
          userId,
          name: input.name,
          key,
          customerId: input.customerId || null,
          allowedDomain: input.allowedDomain?.trim() || null,
          suspensionNotice: input.suspensionNotice?.trim() || null,
          leaseTtlMinutes: input.leaseTtlMinutes,
          gracePeriodHours: input.gracePeriodHours,
          status: "ACTIVE",
        },
      });
    }),

  toggleStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]).optional(),
        suspensionNotice: z.string().optional().nullable(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const license = await ctx.db.license.findUnique({
        where: { id: input.id },
      });

      if (!license || license.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "License not found",
        });
      }

      const nextStatus =
        input.status ?? (license.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");

      // Disablement Guardrail: require explicit rationale when suspending or revoking
      if (nextStatus !== "ACTIVE" && (!input.reason || input.reason.trim().length < 3)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A rationale (minimum 3 characters) is strictly mandatory to suspend or revoke a client service.",
        });
      }

      // Check overdue invoices if linked to customer
      let overdueCount = 0;
      let overdueAmount = 0;
      if (license.customerId) {
        const overdueInvoices = await ctx.db.invoice.findMany({
          where: {
            userId: ctx.session.user.id,
            customerId: license.customerId,
            status: "OVERDUE",
          },
          select: { totalAmount: true },
        });
        overdueCount = overdueInvoices.length;
        overdueAmount = overdueInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
      }

      const updated = await ctx.db.license.update({
        where: { id: input.id },
        data: {
          status: nextStatus,
          ...(input.suspensionNotice !== undefined
            ? { suspensionNotice: input.suspensionNotice }
            : {}),
        },
      });

      // Immutable Audit Trail
      const actionType =
        nextStatus === "ACTIVE"
          ? "SERVICE_ACTIVATED"
          : nextStatus === "SUSPENDED"
          ? "SERVICE_SUSPENDED"
          : "SERVICE_DELETED";

      await recordAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: actionType,
        entityType: "LICENSE",
        entityId: license.id,
        reason:
          input.reason?.trim() ||
          (nextStatus === "ACTIVE"
            ? "Service activated / restored by operator"
            : "Service status updated"),
        metadata: {
          licenseName: license.name,
          previousStatus: license.status,
          nextStatus,
          customerId: license.customerId,
          overdueCount,
          overdueAmount,
        },
      });

      return updated;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        customerId: z.string().optional().nullable(),
        allowedDomain: z.string().optional().nullable(),
        suspensionNotice: z.string().optional().nullable(),
        leaseTtlMinutes: z.number().min(5).max(1440).default(60),
        gracePeriodHours: z.number().min(1).max(72).default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const license = await ctx.db.license.findUnique({
        where: { id: input.id },
      });

      if (!license || license.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "License not found",
        });
      }

      return ctx.db.license.update({
        where: { id: input.id },
        data: {
          name: input.name,
          customerId: input.customerId || null,
          allowedDomain: input.allowedDomain?.trim() || null,
          suspensionNotice: input.suspensionNotice?.trim() || null,
          leaseTtlMinutes: input.leaseTtlMinutes,
          gracePeriodHours: input.gracePeriodHours,
        },
      });
    }),

  regenerateKey: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const license = await ctx.db.license.findUnique({
        where: { id: input.id },
      });

      if (!license || license.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "License not found",
        });
      }

      const newKey = generateLicenseKey();

      const updated = await ctx.db.license.update({
        where: { id: input.id },
        data: {
          key: newKey,
        },
      });

      await recordAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "KEY_REGENERATED",
        entityType: "LICENSE",
        entityId: license.id,
        reason: input.reason?.trim() || "License API key regenerated by operator",
        metadata: {
          licenseName: license.name,
          previousKey: license.key,
          newKey,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const license = await ctx.db.license.findUnique({
        where: { id: input.id },
      });

      if (!license || license.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "License not found",
        });
      }

      const deleted = await ctx.db.license.delete({
        where: { id: input.id },
      });

      await recordAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "SERVICE_DELETED",
        entityType: "LICENSE",
        entityId: license.id,
        reason: input.reason?.trim() || "Service permanently removed by operator",
        metadata: {
          licenseName: license.name,
          key: license.key,
          status: license.status,
        },
      });

      return deleted;
    }),
});
