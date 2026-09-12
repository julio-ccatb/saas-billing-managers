import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { generateLicenseKey } from "~/lib/license/keygen";

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

      return ctx.db.license.update({
        where: { id: input.id },
        data: {
          status: nextStatus,
          ...(input.suspensionNotice !== undefined
            ? { suspensionNotice: input.suspensionNotice }
            : {}),
        },
      });
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
    .input(z.object({ id: z.string() }))
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

      return ctx.db.license.update({
        where: { id: input.id },
        data: {
          key: newKey,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
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

      return ctx.db.license.delete({
        where: { id: input.id },
      });
    }),
});
