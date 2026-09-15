import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, clientProcedure } from "~/server/api/trpc";
import { recordAuditLog } from "~/features/audit/server/auditService";

export const portalRouter = createTRPCRouter({
  /**
   * Get client profile overview including company metadata and account status
   */
  getOverview: clientProcedure.query(async ({ ctx }) => {
    const customer = ctx.customer;

    const [invoices, activeLicenses, activeContracts] = await Promise.all([
      ctx.db.invoice.findMany({
        where: { customerId: customer.id },
        orderBy: { issueDate: "desc" },
        include: {
          receipts: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      ctx.db.license.findMany({
        where: { customerId: customer.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.contract.findMany({
        where: { customerId: customer.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const pendingInvoices = invoices.filter(
      (inv) => inv.status === "PENDING" || inv.status === "OVERDUE"
    );
    const verificationInvoices = invoices.filter(
      (inv) => inv.status === "PAYMENT_PENDING_VERIFICATION"
    );
    const paidInvoices = invoices.filter((inv) => inv.status === "PAID");

    const totalDue = pendingInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        zipCode: customer.zipCode,
        country: customer.country,
        taxId: customer.taxId,
      },
      issuerCompany: {
        id: ctx.company.id,
        name: ctx.company.name,
        email: ctx.company.email,
        phone: ctx.company.phone,
        bankName: ctx.company.bankName,
        bankAccountName: ctx.company.bankAccountName,
        bankAccountNumber: ctx.company.bankAccountNumber,
        currency: ctx.company.currency,
        logoUrl: ctx.company.logoUrl,
      },
      stats: {
        totalDue,
        pendingCount: pendingInvoices.length,
        verificationCount: verificationInvoices.length,
        paidCount: paidInvoices.length,
        activeLicensesCount: activeLicenses.length,
        activeContractsCount: activeContracts.length,
      },
      recentInvoices: invoices.slice(0, 5),
    };
  }),

  /**
   * Get all client invoices with receipt statuses
   */
  getInvoices: clientProcedure
    .input(
      z
        .object({
          status: z
            .enum(["ALL", "PENDING", "PAYMENT_PENDING_VERIFICATION", "PAID", "OVERDUE"])
            .default("ALL"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const customerId = ctx.customerId;
      const status = input?.status ?? "ALL";

      const where: any = { customerId };
      if (status !== "ALL") {
        where.status = status;
      }

      return ctx.db.invoice.findMany({
        where,
        orderBy: { issueDate: "desc" },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
          },
          receipts: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),

  /**
   * Get single invoice details for view / receipt submission
   */
  getInvoiceById: clientProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: {
          items: {
            orderBy: { orderIndex: "asc" },
          },
          receipts: {
            orderBy: { createdAt: "desc" },
          },
          company: true,
        },
      });

      if (!invoice || invoice.customerId !== ctx.customerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found or access denied.",
        });
      }

      return invoice;
    }),

  /**
   * Get client software licenses
   */
  getLicenses: clientProcedure.query(async ({ ctx }) => {
    return ctx.db.license.findMany({
      where: { customerId: ctx.customerId },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Get client contracts
   */
  getContracts: clientProcedure.query(async ({ ctx }) => {
    return ctx.db.contract.findMany({
      where: { customerId: ctx.customerId },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Submit payment receipt for an invoice
   */
  submitReceipt: clientProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        fileName: z.string(),
        fileSize: z.number().max(5 * 1024 * 1024, "File size must be under 5MB"),
        mimeType: z.string(),
        fileData: z.string().min(1, "File content is required"),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.invoiceId },
      });

      if (!invoice || invoice.customerId !== ctx.customerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found or access denied.",
        });
      }

      if (invoice.status === "PAID") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invoice is already marked as paid.",
        });
      }

      const receipt = await ctx.db.paymentReceipt.create({
        data: {
          invoiceId: invoice.id,
          customerId: ctx.customerId,
          uploadedById: ctx.session.user.id,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          fileData: input.fileData,
          notes: input.notes ?? "",
          status: "PENDING_REVIEW",
        },
      });

      // Update invoice status to PAYMENT_PENDING_VERIFICATION
      await ctx.db.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAYMENT_PENDING_VERIFICATION",
        },
      });

      // Record audit event
      await recordAuditLog(ctx.db, {
        companyId: ctx.companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.customer.name,
        action: "BILLING_OVERRIDE",
        entityType: "INVOICE",
        entityId: invoice.id,
        reason: `Client submitted payment receipt (${input.fileName}). Pending operator verification.`,
        metadata: {
          receiptId: receipt.id,
          invoiceNumber: invoice.invoiceNumber,
          fileName: input.fileName,
          notes: input.notes,
        },
      });

      return {
        success: true,
        receiptId: receipt.id,
      };
    }),
});
