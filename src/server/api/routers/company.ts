import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, companyProcedure } from "~/server/api/trpc";
import { companyProfileSchema } from "~/lib/schemas/invoice";
import { recordAuditLog } from "~/features/audit/server/auditService";

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

  /**
   * Get all members in the currently active company.
   */
  getMembers: companyProcedure.query(async ({ ctx }) => {
    const companyId = ctx.companyId;

    const members = await ctx.db.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: {
        id: m.user.id,
        name: m.user.name || "Unnamed Operator",
        email: m.user.email || "",
        image: m.user.image,
      },
    }));
  }),

  /**
   * Add / invite a team member to the active company workspace.
   * Requires OWNER or ADMIN role in the company.
   */
  addMember: companyProcedure
    .input(
      z.object({
        email: z.string().email("A valid email address is required"),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const callerRole = ctx.membership.role;
      if (callerRole !== "OWNER" && callerRole !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only workspace owners or administrators can add team members.",
        });
      }

      const email = input.email.trim().toLowerCase();
      const companyId = ctx.companyId;

      // Find or provision user
      let user = await ctx.db.user.findUnique({
        where: { email },
      });

      if (!user) {
        const fallbackName = email.split("@")[0] || "Operator";
        user = await ctx.db.user.create({
          data: {
            email,
            name: fallbackName,
            userRole: "OPERATOR",
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
          },
        });
      }

      // Check if user is already a member
      const existingMembership = await ctx.db.companyMember.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: user.id,
          },
        },
      });

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This user is already a member of this workspace.",
        });
      }

      // Create membership
      const newMembership = await ctx.db.companyMember.create({
        data: {
          companyId,
          userId: user.id,
          role: input.role,
        },
        include: {
          user: true,
        },
      });

      // Audit Log
      await recordAuditLog(ctx.db, {
        companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "BILLING_OVERRIDE",
        entityType: "CUSTOMER",
        entityId: newMembership.id,
        reason: `Added member ${email} as ${input.role} to ${ctx.company.name}`,
        metadata: {
          memberId: newMembership.id,
          userEmail: email,
          role: input.role,
        },
      });

      return {
        id: newMembership.id,
        userId: newMembership.userId,
        role: newMembership.role,
        createdAt: newMembership.createdAt,
        user: {
          id: newMembership.user.id,
          name: newMembership.user.name,
          email: newMembership.user.email,
          image: newMembership.user.image,
        },
      };
    }),

  /**
   * Update a member's role (OWNER, ADMIN, MEMBER).
   * Only OWNERs can promote/demote OWNERs.
   * Prevents demoting the sole owner of a company.
   */
  updateMemberRole: companyProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const callerRole = ctx.membership.role;
      const companyId = ctx.companyId;

      const targetMember = await ctx.db.companyMember.findUnique({
        where: { id: input.memberId },
        include: { user: true },
      });

      if (!targetMember || targetMember.companyId !== companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found in this workspace.",
        });
      }

      // Only OWNER can assign OWNER or modify an existing OWNER
      if ((input.role === "OWNER" || targetMember.role === "OWNER") && callerRole !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only workspace owners can grant or modify owner roles.",
        });
      }

      // Check if demoting the sole owner
      if (targetMember.role === "OWNER" && input.role !== "OWNER") {
        const ownerCount = await ctx.db.companyMember.count({
          where: { companyId, role: "OWNER" },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot demote the sole owner of the workspace. Promote another owner first.",
          });
        }
      }

      const updated = await ctx.db.companyMember.update({
        where: { id: targetMember.id },
        data: { role: input.role },
        include: { user: true },
      });

      await recordAuditLog(ctx.db, {
        companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "BILLING_OVERRIDE",
        entityType: "CUSTOMER",
        entityId: updated.id,
        reason: `Changed role of ${targetMember.user.email} from ${targetMember.role} to ${input.role}`,
        metadata: {
          memberId: updated.id,
          userEmail: targetMember.user.email,
          previousRole: targetMember.role,
          newRole: input.role,
        },
      });

      return updated;
    }),

  /**
   * Remove a member from the company workspace.
   * Prevents removing the sole owner.
   */
  removeMember: companyProcedure
    .input(
      z.object({
        memberId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const callerRole = ctx.membership.role;
      const companyId = ctx.companyId;

      const targetMember = await ctx.db.companyMember.findUnique({
        where: { id: input.memberId },
        include: { user: true },
      });

      if (!targetMember || targetMember.companyId !== companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found in this workspace.",
        });
      }

      // Prevent non-owners from removing an OWNER
      if (targetMember.role === "OWNER" && callerRole !== "OWNER") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only workspace owners can remove an owner.",
        });
      }

      // Prevent removing the sole owner
      if (targetMember.role === "OWNER") {
        const ownerCount = await ctx.db.companyMember.count({
          where: { companyId, role: "OWNER" },
        });
        if (ownerCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot remove the sole owner of the workspace.",
          });
        }
      }

      const deleted = await ctx.db.companyMember.delete({
        where: { id: targetMember.id },
      });

      await recordAuditLog(ctx.db, {
        companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "BILLING_OVERRIDE",
        entityType: "CUSTOMER",
        entityId: targetMember.id,
        reason: `Removed member ${targetMember.user.email} (${targetMember.role}) from workspace`,
        metadata: {
          memberId: targetMember.id,
          userEmail: targetMember.user.email,
          role: targetMember.role,
        },
      });

      return deleted;
    }),
});
