import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, companyProcedure } from "~/server/api/trpc";
import { recordAuditLog } from "~/features/audit/server/auditService";

export const contractRouter = createTRPCRouter({
  getAll: companyProcedure
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
      const companyId = ctx.companyId;
      const search = input?.search?.trim();
      const status = input?.status && input.status !== "ALL" ? input.status : undefined;
      const customerId = input?.customerId;

      const where: any = { companyId };
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

  getById: companyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
        include: {
          customer: true,
        },
      });

      if (!contract || contract.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      return contract;
    }),

  getMetrics: companyProcedure.query(async ({ ctx }) => {
    const companyId = ctx.companyId;

    const contracts = await ctx.db.contract.findMany({
      where: { companyId },
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

  create: companyProcedure
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
        status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
        terms: z.string().default(""),
        notes: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;

      const customer = await ctx.db.customer.findUnique({
        where: { id: input.customerId },
      });
      if (!customer || customer.companyId !== companyId) {
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
          companyId,
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
        companyId,
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

  update: companyProcedure
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
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
      });

      if (!contract || contract.companyId !== companyId) {
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
        companyId,
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

  terminate: companyProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(3, "Mandatory rationale is required to terminate a contract"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.id },
      });

      if (!contract || contract.companyId !== companyId) {
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
        companyId,
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

  sendForSignature: companyProcedure
    .input(
      z.object({
        contractId: z.string(),
        templateId: z.union([z.string(), z.number()]).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;
      const company = ctx.company;
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.contractId },
        include: { customer: true },
      });

      if (!contract || contract.companyId !== companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      if (contract.status === "TERMINATED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot send a terminated contract for signature.",
        });
      }

      const vendorAddressParts = [
        company.address,
        company.city,
        company.zipCode,
        company.country,
      ].filter(Boolean);

      const resolvedCompanyProfile = {
        companyName: company.name || ctx.session.user.name || "Service Provider",
        email: company.email || ctx.session.user.email || "billing@saas.com",
        phone: company.phone || "",
        address: vendorAddressParts.length > 0 ? vendorAddressParts.join(", ") : "",
        taxId: company.taxId || "",
        signatureData: company.signatureData || null,
      };

      const { createDynamicDocuSealSubmission } = await import("./docusealService");

      const result = await createDynamicDocuSealSubmission({
        templateId: input.templateId,
        contract: {
          id: contract.id,
          contractNumber: contract.contractNumber,
          title: contract.title,
          value: contract.value,
          currency: contract.currency,
          billingCycle: contract.billingCycle,
          startDate: contract.startDate,
          endDate: contract.endDate,
          terms: contract.terms,
        },
        customer: {
          name: contract.customer.name,
          email: contract.customer.email,
          phone: contract.customer.phone,
          address: contract.customer.address,
          taxId: contract.customer.taxId,
        },
        companyProfile: resolvedCompanyProfile,
      });

      // Persist submissionId on the contract record
      await ctx.db.contract.update({
        where: { id: contract.id },
        data: {
          submissionId: result.submissionId,
        },
      });

      await recordAuditLog(ctx.db, {
        companyId,
        userId,
        operatorId: ctx.session.user.email ?? userId,
        action: "CONTRACT_DISPATCHED_FOR_SIGNATURE",
        entityType: "CONTRACT",
        entityId: contract.id,
        reason: `Dispatched e-signature request to DocuSeal (Submission #${result.submissionId})`,
        metadata: {
          submissionId: result.submissionId,
          templateId: input.templateId ?? null,
          slug: result.slug,
          signingUrl: result.signingUrl,
          customerEmail: contract.customer.email,
        },
      });

      return {
        success: true,
        signingUrl: result.signingUrl,
        submissionId: result.submissionId,
        contractNumber: contract.contractNumber,
      };
    }),

  syncDocuSealStatus: companyProcedure
    .input(
      z.object({
        contractId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;
      const contract = await ctx.db.contract.findUnique({
        where: { id: input.contractId },
      });

      if (!contract || contract.companyId !== companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Contract not found",
        });
      }

      if (!contract.submissionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This contract has not been dispatched to DocuSeal yet.",
        });
      }

      const { getDocuSealSubmission } = await import("./docusealService");
      const submission = await getDocuSealSubmission(contract.submissionId);

      if (submission.status === "completed") {
        const { processContractCompletion } = await import("./contractCompletionService");
        const result = await processContractCompletion(ctx.db, {
          contractIdentifier: contract.id,
          submissionId: submission.id,
          documents: submission.documents,
          submitters: submission.submitters,
          operatorId: ctx.session.user.email ?? userId,
        });

        return {
          success: true,
          isCompleted: true,
          docuSealStatus: submission.status,
          contract: result.contract,
          generatedInvoiceId: result.generatedInvoiceId,
          signedDocumentUrl: result.signedDocumentUrl,
          message: "Contract signed and activated successfully!",
        };
      }

      return {
        success: true,
        isCompleted: false,
        docuSealStatus: submission.status,
        message: `DocuSeal submission status is currently: ${submission.status}`,
      };
    }),
});

