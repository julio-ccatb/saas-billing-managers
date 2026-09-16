import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { sendPasswordResetEmail } from "~/server/services/emailService";
import { recordAuditLog } from "~/features/audit/server/auditService";

export const authRouter = createTRPCRouter({
  /**
   * Request a password reset link.
   * Self-service flow for external clients with registered portal accounts.
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please provide a valid email address"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();

      // Find user
      const user = await ctx.db.user.findUnique({
        where: { email },
        include: {
          clientProfile: {
            include: {
              company: true,
            },
          },
        },
      });

      // To prevent email enumeration, return generic success even if user not found or not a client
      if (!user || (!user.clientProfile && user.userRole !== "CLIENT")) {
        return {
          success: true,
          message: "If an account with that email exists, a password reset link has been dispatched.",
        };
      }

      // Invalidate any existing unexpired tokens for this email
      await ctx.db.passwordResetToken.deleteMany({
        where: { email },
      });

      // Generate a cryptographically secure 32-byte hex token
      const rawToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await ctx.db.passwordResetToken.create({
        data: {
          email,
          token: rawToken,
          expiresAt,
        },
      });

      // Construct reset URL
      const host =
        ctx.headers?.get("x-forwarded-host") ||
        ctx.headers?.get("host") ||
        "localhost:3000";
      const protocol =
        ctx.headers?.get("x-forwarded-proto") ||
        (host.includes("localhost") ? "http" : "https");
      const resetUrl = `${protocol}://${host}/auth/reset-password?token=${rawToken}`;

      const companyName = user.clientProfile?.company?.name || "Client Software Operations";

      // Dispatch transactional reset email
      await sendPasswordResetEmail({
        recipientEmail: email,
        recipientName: user.name ?? user.clientProfile?.name,
        resetUrl,
        companyName,
      });

      // Record audit log if client has an associated company
      if (user.clientProfile?.companyId) {
        await recordAuditLog(ctx.db, {
          companyId: user.clientProfile.companyId,
          userId: user.id,
          operatorId: email,
          action: "PASSWORD_RESET_REQUESTED",
          entityType: "CUSTOMER",
          entityId: user.clientProfile.id,
          reason: `Client requested self-service password reset.`,
          metadata: {
            email,
            expiresAt: expiresAt.toISOString(),
          },
        });
      }

      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been dispatched.",
        // Include devResetUrl in non-production environments to allow instant manual testing
        devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
      };
    }),

  /**
   * Verify if a reset token is valid and not expired.
   */
  verifyResetToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
      })
    )
    .query(async ({ ctx, input }) => {
      const resetToken = await ctx.db.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        return {
          valid: false,
          email: null,
        };
      }

      return {
        valid: true,
        email: resetToken.email,
      };
    }),

  /**
   * Reset client password using a valid token.
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters long"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const resetToken = await ctx.db.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This password reset token has expired or is invalid. Please request a new one.",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { email: resetToken.email },
        include: { clientProfile: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found associated with this reset token.",
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(input.newPassword, 10);

      // Update password hash and set email verified timestamp if not present
      await ctx.db.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          userRole: "CLIENT",
          emailVerified: user.emailVerified || new Date(),
        },
      });

      // Delete consumed token
      await ctx.db.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      // Audit log
      if (user.clientProfile?.companyId) {
        await recordAuditLog(ctx.db, {
          companyId: user.clientProfile.companyId,
          userId: user.id,
          operatorId: user.email ?? user.id,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "CUSTOMER",
          entityId: user.clientProfile.id,
          reason: `Client completed self-service password reset.`,
          metadata: {
            email: resetToken.email,
          },
        });
      }

      return {
        success: true,
        message: "Your password has been successfully updated. You may now log in.",
      };
    }),
});
