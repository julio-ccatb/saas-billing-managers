import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { recordAuditLog } from "~/features/audit/server/auditService";

export const contractRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          customerId: z.string().optional(),
          status: z.enum(["ALL", "DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const search = input?.search?.trim();
      const status = input?.status && input.status !== "ALL" ? input.status : undefined;
      const customerId = input?.customerId;

      const where: any = { userId };
      if (status) where.status = status;
      if (customerId) where.customerId = customerId;
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { contractNumber: { contains: search } },
          { customer: { name: { contains: search } } },
        ];
      }

      return ctx.db.contract.findMany({
        where,
        orderBy: { createdAt: "desc" },
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

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
        },
      });

      if (!contract || contract.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      return contract;
    }),

  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const contracts = await ctx.db.contract.findMany({
      where: { userId },
      select: {
        status: true,
        value: true,
        billingCycle: true,
      },
    });

    let totalActiveValue = 0;
    let estimatedMRR = 0;
    let activeCount = 0;
    let draftCount = 0;
    let terminatedCount = 0;

    for (const c of contracts) {
      if (c.status === "ACTIVE") {
        activeCount++;
        totalActiveValue += c.value;

        if (c.billingCycle === "MONTHLY") {
          estimatedMRR += c.value;
        } else if (c.billingCycle === "ANNUALLY") {
          estimatedMRR += c.value / 12;
        } else if (c.billingCycle === "QUARTERLY") {
          estimatedMRR += c.value / 3;
        }
      } else if (c.status === "DRAFT") {
        draftCount++;
      } else if (c.status === "TERMINATED") {
        terminatedCount++;
      }
    }

    return {
      totalContracts: contracts.length,
      activeCount,
      draftCount,
      terminatedCount,
      totalActiveValue,
      estimatedMRR,
    };
  }),

  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        title: z.string().min(1, "Contract title is required"),
        contractNumber: z.string().optional(),
        value: z.number().min(0).default(0),
        currency: z.string().default("USD"),
        billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]).default("MONTHLY"),
        startDate: z.date().default(() => new Date()),
        endDate: z.date().optional().nullable(),
        status: z.enum(["DRAFT", "ACTIVE"]).default("ACTIVE"),
        terms: z.string().default(""),
        notes: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const customer = await ctx.db.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!customer || customer.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      const contractNumber =
        input.contractNumber?.trim() ||
        `CTR-${Date.now().toString().slice(-6)}`;

      const contract = await ctx.db.contract.create({
        data: {
          userId,
          customerId: input.customerId,
          contractNumber,
          title: input.title,
          value: input.value,
          currency: input.currency,
          billingCycle: input.billingCycle,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          signedAt: input.status === "ACTIVE" ? new Date() : null,
          status: input.status,
          terms: input.terms,
          notes: input.notes,
        },
      });

      await recordAuditLog(ctx.db, {
        userId,
        operatorId: ctx.session.user.email ?? userId,
        action: "CONTRACT_CREATED",
        entityType: "CONTRACT",
        entityId: contract.id,
        reason: "Contract initiated by operator",
        metadata: {
          contractNumber: contract.contractNumber,
          customerName: customer.name,
          value: contract.value,
          status: contract.status,
        },
      });

      return contract;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        value: z.number().min(0),
        currency: z.string(),
        billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY", "ONE_TIME"]),
        endDate: z.date().optional().nullable(),
        terms: z.string(),
        notes: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
      });

      if (!contract || contract.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      if (contract.status === "TERMINATED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Terminated contracts are immutable and cannot be updated.",
        });
      }

      const updated = await ctx.db.contract.update({
        where: { id: input.id },
        data: {
          title: input.title,
          value: input.value,
          currency: input.currency,
          billingCycle: input.billingCycle,
          endDate: input.endDate ?? null,
          terms: input.terms,
          notes: input.notes,
        },
      });

      await recordAuditLog(ctx.db, {
        userId,
        operatorId: ctx.session.user.email ?? userId,
        action: "CONTRACT_UPDATED",
        entityType: "CONTRACT",
        entityId: contract.id,
        reason: input.reason?.trim() || "Contract terms amended",
        metadata: {
          previousValue: contract.value,
          newValue: input.value,
          previousTitle: contract.title,
        },
      });

      return updated;
    }),

  terminate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(3, "Mandatory rationale is required to terminate a contract"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
      });

      if (!contract || contract.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      const terminated = await ctx.db.contract.update({
        where: { id: input.id },
        data: {
          status: "TERMINATED",
          endDate: new Date(),
        },
      });

      await recordAuditLog(ctx.db, {
        userId,
        operatorId: ctx.session.user.email ?? userId,
        action: "CONTRACT_TERMINATED",
        entityType: "CONTRACT",
        entityId: contract.id,
        reason: input.reason,
        metadata: {
          contractNumber: contract.contractNumber,
          previousStatus: contract.status,
          terminatedAt: new Date().toISOString(),
        },
      });

      return terminated;
    }),
});
