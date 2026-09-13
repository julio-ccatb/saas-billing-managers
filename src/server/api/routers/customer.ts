import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { customerSchema } from "~/lib/schemas/invoice";
import { recordAuditLog } from "~/server/services/audit";

export const customerRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const search = input?.search?.trim();

      const where: any = { userId };
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
        ];
      }

      return ctx.db.customer.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { invoices: true },
          },
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db.customer.findUnique({
        where: { id: input.id },
        include: {
          contracts: {
            orderBy: { createdAt: "desc" },
          },
          licenses: {
            orderBy: { createdAt: "desc" },
          },
          invoices: {
            orderBy: { issueDate: "desc" },
          },
        },
      });

      if (!customer || customer.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      return customer;
    }),

  upsert: protectedProcedure
    .input(customerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      if (id) {
        const existing = await ctx.db.customer.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }
        return ctx.db.customer.update({
          where: { id },
          data,
        });
      }

      return ctx.db.customer.create({
        data: {
          ...data,
          userId,
        },
      });
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.customer.findUnique({ where: { id: input.id } });
      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      const deleted = await ctx.db.customer.delete({
        where: { id: input.id },
      });

      await recordAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "CUSTOMER_DELETED",
        entityType: "CUSTOMER",
        entityId: existing.id,
        reason: input.reason?.trim() || "Customer removed by operator",
        metadata: {
          customerName: existing.name,
          email: existing.email,
        },
      });

      return deleted;
    }),
});
