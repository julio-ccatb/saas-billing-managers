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

describe("Email Service - Contract Signing Invitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should simulate contract signing email sending when RESEND_API_KEY is not configured", async () => {
    const { sendContractSigningEmail } = await import("./emailService");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendContractSigningEmail({
      recipientEmail: "signer@acme.com",
      recipientName: "John Signer",
      contractNumber: "CTR-2026-009",
      contractTitle: "Enterprise SLA Agreement",
      contractValue: 12000,
      currency: "USD",
      billingCycle: "MONTHLY",
      signingUrl: "https://lg.jcodea.com/s/test-slug-123",
      companyName: "Acme Cloud",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("simulated-dev-id");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[CONTRACT SIGNING EMAIL SIMULATION]")
    );

    consoleSpy.mockRestore();
  });

  it("should render branded HTML with contract details and signing URL", async () => {
    const { renderContractSigningEmailHtml } = await import("./emailService");

    const html = renderContractSigningEmailHtml({
      recipientName: "Alice Cooper",
      contractNumber: "CTR-881293",
      contractTitle: "Managed DevOps Retainer",
      contractValue: 4500,
      currency: "USD",
      billingCycle: "MONTHLY",
      signingUrl: "https://lg.jcodea.com/s/alice-slug-777",
      senderName: "DevOps Ops HQ",
    });

    expect(html).toContain("Alice Cooper");
    expect(html).toContain("CTR-881293");
    expect(html).toContain("Managed DevOps Retainer");
    expect(html).toContain("https://lg.jcodea.com/s/alice-slug-777");
    expect(html).toContain("Review &amp; Sign Agreement");
    expect(html).toContain("DevOps Ops HQ");
  });
});

