import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPasswordResetEmail } from "./emailService";

// Mock env
vi.mock("~/env", () => ({
  env: {
    EMAIL_FROM: "Acme Test <test@example.com>",
    RESEND_API_KEY: undefined,
  },
}));

describe("Email Service - Password Reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should simulate email sending when RESEND_API_KEY is not configured", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendPasswordResetEmail({
      recipientEmail: "client@example.com",
      recipientName: "Test Client",
      resetUrl: "https://example.com/auth/reset-password?token=test-token-123",
      companyName: "Acme SaaS",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("simulated-dev-id");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[PASSWORD RESET EMAIL SIMULATION]")
    );

    consoleSpy.mockRestore();
  });
});
