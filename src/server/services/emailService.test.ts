import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendPasswordResetEmail,
  sendPortalInvitationEmail,
  renderPortalInvitationEmailHtml,
} from "./emailService";

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

describe("Email Service - Portal Invitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should simulate portal invitation email sending when RESEND_API_KEY is not configured", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendPortalInvitationEmail({
      recipientEmail: "client@example.com",
      recipientName: "Acme Client Contact",
      setupUrl: "https://example.com/auth/reset-password?token=invite-token-456&setup=true",
      companyName: "Acme Corp",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("simulated-dev-id");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[PORTAL INVITATION EMAIL SIMULATION]")
    );

    consoleSpy.mockRestore();
  });

  it("should render branded HTML with recipient name, setup URL, and sender name", () => {
    const html = renderPortalInvitationEmailHtml({
      recipientName: "Jane Doe",
      setupUrl: "https://app.com/auth/reset-password?token=test-xyz&setup=true",
      senderName: "Operations HQ",
    });

    expect(html).toContain("Jane Doe");
    expect(html).toContain("https://app.com/auth/reset-password?token=test-xyz&setup=true");
    expect(html).toContain("Operations HQ");
    expect(html).toContain("Set Password & Access Portal");
  });
});
