import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Mock DB
const mockDb = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  passwordResetToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

vi.mock("~/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

vi.mock("~/server/db", () => ({
  db: mockDb,
}));


vi.mock("~/server/services/emailService", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-id" }),
}));

vi.mock("~/features/audit/server/auditService", () => ({
  recordAuditLog: vi.fn().mockResolvedValue({ id: "audit-1" }),
}));

import { authRouter } from "./auth";

describe("authRouter tRPC procedures", () => {
  const caller = authRouter.createCaller({
    db: mockDb as any,
    session: null,
    headers: new Headers(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requestPasswordReset", () => {
    it("should generate a reset token and send email for valid client user", async () => {
      mockDb.user.findUnique.mockResolvedValueOnce({
        id: "client-1",
        email: "client@test.com",
        name: "Test Client",
        userRole: "CLIENT",
        clientProfile: {
          id: "customer-1",
          companyId: "company-1",
          company: { name: "Test Corp" },
        },
      });

      const res = await caller.requestPasswordReset({ email: "client@test.com" });

      expect(res.success).toBe(true);
      expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: "client@test.com" },
      });
      expect(mockDb.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "client@test.com",
          }),
        })
      );
    });

    it("should return generic success message when user does not exist (enumeration defense)", async () => {
      mockDb.user.findUnique.mockResolvedValueOnce(null);

      const res = await caller.requestPasswordReset({ email: "nonexistent@test.com" });

      expect(res.success).toBe(true);
      expect(res.message).toContain("If an account with that email exists");
      expect(mockDb.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it("should return generic success message when user is an operator without client profile", async () => {
      mockDb.user.findUnique.mockResolvedValueOnce({
        id: "operator-1",
        email: "admin@test.com",
        userRole: "OPERATOR",
        clientProfile: null,
      });

      const res = await caller.requestPasswordReset({ email: "admin@test.com" });

      expect(res.success).toBe(true);
      expect(mockDb.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe("verifyResetToken", () => {
    it("should return valid: true for unexpired token", async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: "token-1",
        email: "client@test.com",
        token: "valid-token-abc",
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 mins in future
      });

      const res = await caller.verifyResetToken({ token: "valid-token-abc" });

      expect(res.valid).toBe(true);
      expect(res.email).toBe("client@test.com");
    });

    it("should return valid: false for expired token", async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValueOnce({
        id: "token-1",
        email: "client@test.com",
        token: "expired-token",
        expiresAt: new Date(Date.now() - 1000 * 60), // 1 min ago
      });

      const res = await caller.verifyResetToken({ token: "expired-token" });

      expect(res.valid).toBe(false);
      expect(res.email).toBeNull();
    });

    it("should return valid: false when token not found", async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      const res = await caller.verifyResetToken({ token: "nonexistent-token" });

      expect(res.valid).toBe(false);
      expect(res.email).toBeNull();
    });
  });

  describe("resetPassword", () => {
    it("should successfully update password and delete single-use token", async () => {
      const resetToken = {
        id: "token-1",
        email: "client@test.com",
        token: "valid-token-123",
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
      };

      mockDb.passwordResetToken.findUnique.mockResolvedValueOnce(resetToken);
      mockDb.user.findUnique.mockResolvedValueOnce({
        id: "client-1",
        email: "client@test.com",
        userRole: "CLIENT",
        clientProfile: { id: "customer-1", companyId: "company-1" },
      });

      const res = await caller.resetPassword({
        token: "valid-token-123",
        newPassword: "BrandNewSecurePassword123!",
      });

      expect(res.success).toBe(true);
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "client-1" },
          data: expect.objectContaining({
            userRole: "CLIENT",
          }),
        })
      );
      expect(mockDb.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: "token-1" },
      });
    });

    it("should reject when token is invalid or expired", async () => {
      mockDb.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.resetPassword({
          token: "invalid-token",
          newPassword: "BrandNewSecurePassword123!",
        })
      ).rejects.toThrow("expired or is invalid");
    });
  });
});
