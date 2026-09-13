import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { invoiceSchema } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals } from "~/lib/utils/format";
import { recordAuditLog } from "~/server/services/audit";

export const invoiceRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.enum(["ALL", "DRAFT", "PENDING", "PAID", "OVERDUE"]).default("ALL"),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, search, page, pageSize } = input;
      const userId = ctx.session.user.id;

      const where: any = { userId };
      if (status !== "ALL") {
        where.status = status;
      }
      if (search && search.trim() !== "") {
        where.OR = [
          { invoiceNumber: { contains: search } },
          { receiverName: { contains: search } },
          { receiverEmail: { contains: search } },
        ];
      }

      const [totalCount, invoices] = await Promise.all([
        ctx.db.invoice.count({ where }),
        ctx.db.invoice.findMany({
          where,
          orderBy: { issueDate: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            items: {
              orderBy: { orderIndex: "asc" },
            },
            customer: true,
          },
        }),
      ]);

      return {
        invoices,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        page,
        pageSize,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
          },
          customer: true,
        },
      });

      if (!invoice || invoice.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      return invoice;
    }),

  getNextInvoiceNumber: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const count = await ctx.db.invoice.count({ where: { userId } });
    const year = new Date().getFullYear();
    const nextNum = (count + 1).toString().padStart(4, "0");
    return `INV-${year}-${nextNum}`;
  }),

  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const invoices = await ctx.db.invoice.findMany({
      where: { userId },
      select: {
        status: true,
        totalAmount: true,
        dueDate: true,
      },
    });

    const now = new Date();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    let draftCount = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    let overdueUnder30 = 0;
    let overdue30To60 = 0;
    let overdueOver60 = 0;

    for (const inv of invoices) {
      totalInvoiced += inv.totalAmount;
      const isOverdue = inv.status !== "PAID" && new Date(inv.dueDate) < now;

      if (inv.status === "PAID") {
        totalPaid += inv.totalAmount;
        paidCount++;
      } else if (isOverdue || inv.status === "OVERDUE") {
        totalOverdue += inv.totalAmount;
        overdueCount++;
        const daysOverdue = Math.max(
          0,
          Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        );
        if (daysOverdue <= 30) {
          overdueUnder30 += inv.totalAmount;
        } else if (daysOverdue <= 60) {
          overdue30To60 += inv.totalAmount;
        } else {
          overdueOver60 += inv.totalAmount;
        }
      } else if (inv.status === "DRAFT") {
        draftCount++;
      } else {
        totalPending += inv.totalAmount;
        pendingCount++;
      }
    }

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      counts: {
        total: invoices.length,
        draft: draftCount,
        pending: pendingCount,
        paid: paidCount,
        overdue: overdueCount,
      },
      aging: {
        under30: overdueUnder30,
        between30And60: overdue30To60,
        over60: overdueOver60,
      },
    };
  }),

  create: protectedProcedure
    .input(invoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { items, ...invoiceData } = input;

      const totals = calculateInvoiceTotals({
        items,
        taxRate: invoiceData.taxRate,
        discountRate: invoiceData.discountRate,
        shippingAmount: invoiceData.shippingAmount,
      });

      return ctx.db.invoice.create({
        data: {
          ...invoiceData,
          userId,
          subTotal: totals.subTotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
          items: {
            create: items.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: Number((item.quantity * item.unitPrice).toFixed(2)),
              orderIndex: item.orderIndex ?? index,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      invoiceSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, items, ...invoiceData } = input;

      const existing = await ctx.db.invoice.findUnique({
        where: { id },
      });

      if (!existing || existing.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found or unauthorized",
        });
      }

      const totals = calculateInvoiceTotals({
        items,
        taxRate: invoiceData.taxRate,
        discountRate: invoiceData.discountRate,
        shippingAmount: invoiceData.shippingAmount,
      });

      // Update invoice and replace items atomically
      return ctx.db.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        return tx.invoice.update({
          where: { id },
          data: {
            ...invoiceData,
            subTotal: totals.subTotal,
            taxAmount: totals.taxAmount,
            discountAmount: totals.discountAmount,
            totalAmount: totals.totalAmount,
            items: {
              create: items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: Number((item.quantity * item.unitPrice).toFixed(2)),
                orderIndex: item.orderIndex ?? index,
              })),
            },
          },
          include: {
            items: true,
          },
        });
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "PENDING", "PAID", "OVERDUE"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.invoice.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const updated = await ctx.db.invoice.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      await recordAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "BILLING_OVERRIDE",
        entityType: "INVOICE",
        entityId: existing.id,
        reason: input.reason?.trim() || `Invoice status changed to ${input.status}`,
        metadata: {
          invoiceNumber: existing.invoiceNumber,
          previousStatus: existing.status,
          nextStatus: input.status,
          totalAmount: existing.totalAmount,
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
      const existing = await ctx.db.invoice.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const deleted = await ctx.db.invoice.delete({
        where: { id: input.id },
      });

      await recordAuditLog(ctx.db, {
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "BILLING_OVERRIDE",
        entityType: "INVOICE",
        entityId: existing.id,
        reason: input.reason?.trim() || "Invoice deleted by operator",
        metadata: {
          invoiceNumber: existing.invoiceNumber,
          status: existing.status,
          totalAmount: existing.totalAmount,
        },
      });

      return deleted;
    }),
});
