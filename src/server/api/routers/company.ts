import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, companyProcedure } from "~/server/api/trpc";
import { companyProfileSchema } from "~/lib/schemas/invoice";

export const companyRouter = createTRPCRouter({
  /**
   * List all companies the current user is a member of.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Ensure user has at least one company
    const memberships = await ctx.db.companyMember.findMany({
      where: { userId },
      include: {
        company: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (memberships.length === 0) {
      const defaultCompanyName = ctx.session.user.name
        ? `${ctx.session.user.name}'s Workspace`
        : "My Workspace";

      const newCompany = await ctx.db.company.create({
        data: {
          name: defaultCompanyName,
          email: ctx.session.user.email ?? "",
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
        include: {
          members: true,
        },
      });

      return [
        {
          id: newCompany.id,
          name: newCompany.name,
          role: "OWNER",
          logoUrl: newCompany.logoUrl,
          currency: newCompany.currency,
          company: newCompany,
        },
      ];
    }

    return memberships.map((m) => ({
      id: m.company.id,
      name: m.company.name,
      role: m.role,
      logoUrl: m.company.logoUrl,
      currency: m.company.currency,
      company: m.company,
    }));
  }),

  /**
   * Get the active company profile and billing defaults.
   */
  getActive: companyProcedure.query(async ({ ctx }) => {
    return {
      ...ctx.company,
      companyName: ctx.company.name,
      role: ctx.membership.role,
    };
  }),

  /**
   * Create a new company workspace and add user as OWNER.
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Company name is required"),
        currency: z.string().default("USD"),
        email: z.string().email().or(z.literal("")).default(""),
        phone: z.string().default(""),
        taxId: z.string().default(""),
        address: z.string().default(""),
        city: z.string().default(""),
        zipCode: z.string().default(""),
        country: z.string().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const company = await ctx.db.company.create({
        data: {
          name: input.name.trim(),
          currency: input.currency,
          email: input.email.trim(),
          phone: input.phone.trim(),
          taxId: input.taxId.trim(),
          address: input.address.trim(),
          city: input.city.trim(),
          zipCode: input.zipCode.trim(),
          country: input.country.trim(),
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
      });

      return company;
    }),

  /**
   * Update active company information.
   */
  update: companyProcedure
    .input(companyProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;

      return ctx.db.company.update({
        where: { id: companyId },
        data: {
          name: input.companyName?.trim() || ctx.company.name,
          email: input.email?.trim() ?? "",
          phone: input.phone?.trim() ?? "",
          address: input.address?.trim() ?? "",
          city: input.city?.trim() ?? "",
          zipCode: input.zipCode?.trim() ?? "",
          country: input.country?.trim() ?? "",
          taxId: input.taxId?.trim() ?? "",
          bankName: input.bankName?.trim() ?? "",
          bankAccountName: input.bankAccountName?.trim() ?? "",
          bankAccountNumber: input.bankAccountNumber?.trim() ?? "",
          logoUrl: input.logoUrl ?? null,
          signatureData: input.signatureData ?? null,
          currency: input.currency || "USD",
          paymentTerms: input.paymentTerms || "Payment due upon receipt",
          notes: input.notes || "Thank you for your business!",
        },
      });
    }),
});
