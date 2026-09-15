import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, companyProcedure } from "~/server/api/trpc";
import { invoiceSchema } from "~/lib/schemas/invoice";
import { calculateInvoiceTotals } from "~/lib/utils/format";
import { recordAuditLog } from "~/features/audit/server/auditService";

export const invoiceRouter = createTRPCRouter({
  getAll: companyProcedure
    .input(
      z.object({
        status: z.enum(["ALL", "DRAFT", "PENDING", "PAYMENT_PENDING_VERIFICATION", "PAID", "OVERDUE"]).default("ALL"),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, search, page, pageSize } = input;
      const companyId = ctx.companyId;

      const where: any = { companyId };
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
            receipts: {
              orderBy: { createdAt: "desc" },
            },
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

  getById: companyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
          },
          customer: true,
          receipts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!invoice || invoice.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      return invoice;
    }),

  getNextInvoiceNumber: companyProcedure.query(async ({ ctx }) => {
    const companyId = ctx.companyId;
    const count = await ctx.db.invoice.count({ where: { companyId } });
    const year = new Date().getFullYear();
    const nextNum = (count + 1).toString().padStart(4, "0");
    return `INV-${year}-${nextNum}`;
  }),

  getMetrics: companyProcedure.query(async ({ ctx }) => {
    const companyId = ctx.companyId;
    const invoices = await ctx.db.invoice.findMany({
      where: { companyId },
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

  create: companyProcedure
    .input(invoiceSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
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
          companyId,
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

  update: companyProcedure
    .input(
      invoiceSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const { id, items, ...invoiceData } = input;

      const existing = await ctx.db.invoice.findUnique({
        where: { id },
      });

      if (!existing || existing.companyId !== companyId) {
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

  updateStatus: companyProcedure
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

      if (!existing || existing.companyId !== ctx.companyId) {
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
        companyId: ctx.companyId,
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

  delete: companyProcedure
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

      if (!existing || existing.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      const deleted = await ctx.db.invoice.delete({
        where: { id: input.id },
      });

      await recordAuditLog(ctx.db, {
        companyId: ctx.companyId,
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

  /**
   * Verify an uploaded client payment receipt (Approve or Reject)
   */
  verifyReceipt: companyProcedure
    .input(
      z.object({
        receiptId: z.string(),
        action: z.enum(["APPROVE", "REJECT"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const receipt = await ctx.db.paymentReceipt.findUnique({
        where: { id: input.receiptId },
        include: {
          invoice: true,
          customer: true,
        },
      });

      if (!receipt || receipt.invoice.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment receipt not found or unauthorized.",
        });
      }

      const isApprove = input.action === "APPROVE";
      const now = new Date();

      const [updatedReceipt, updatedInvoice] = await ctx.db.$transaction([
        ctx.db.paymentReceipt.update({
          where: { id: receipt.id },
          data: {
            status: isApprove ? "APPROVED" : "REJECTED",
            rejectionReason: !isApprove ? input.reason ?? "Payment receipt rejected by operator" : null,
            reviewedById: ctx.session.user.id,
            reviewedAt: now,
          },
        }),
        ctx.db.invoice.update({
          where: { id: receipt.invoiceId },
          data: {
            status: isApprove
              ? "PAID"
              : receipt.invoice.dueDate < now
              ? "OVERDUE"
              : "PENDING",
          },
        }),
      ]);

      await recordAuditLog(ctx.db, {
        companyId: ctx.companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: isApprove ? "BILLING_OVERRIDE" : "BILLING_OVERRIDE",
        entityType: "INVOICE",
        entityId: receipt.invoiceId,
        reason: isApprove
          ? `Payment receipt ${receipt.fileName} approved. Invoice marked as PAID.`
          : `Payment receipt ${receipt.fileName} rejected: ${input.reason ?? "Unverified proof"}.`,
        metadata: {
          receiptId: receipt.id,
          invoiceNumber: receipt.invoice.invoiceNumber,
          action: input.action,
          reason: input.reason,
          totalAmount: receipt.invoice.totalAmount,
        },
      });

      return {
        success: true,
        receipt: updatedReceipt,
        invoice: updatedInvoice,
      };
    }),
});
