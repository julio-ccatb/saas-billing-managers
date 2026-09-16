import { Resend } from "resend";
import { env } from "~/env";
import { formatCurrency, formatDate } from "~/lib/utils/format";

// Global singleton instance for Resend
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SendInvoiceEmailParams {
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: Date | string;
    dueDate: Date | string;
    currency: string;
    subTotal: number;
    taxAmount: number;
    totalAmount: number;
    senderName?: string | null;
    senderEmail?: string | null;
    receiverName: string;
    receiverEmail?: string | null;
    notes?: string | null;
    paymentTerms?: string | null;
    bankName?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
  recipientEmail: string;
  pdfBuffer: Buffer | Uint8Array;
  customMessage?: string;
  companyName?: string;
}

/**
 * Generates an operational, CSOC-branded HTML template for invoice delivery
 */
export function renderInvoiceEmailHtml(params: {
  invoice: SendInvoiceEmailParams["invoice"];
  customMessage?: string;
  senderName: string;
}): string {
  const { invoice, customMessage, senderName } = params;

  const itemsHtml = (invoice.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">${item.description}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: center; color: #475569;">${item.quantity}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-family: monospace; color: #475569;">${formatCurrency(
          item.unitPrice,
          invoice.currency
        )}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-family: monospace; font-weight: 600; color: #0f172a;">${formatCurrency(
          item.total,
          invoice.currency
        )}</td>
      </tr>`
    )
    .join("");

  const bankInfoHtml =
    invoice.bankName || invoice.bankAccountNumber
      ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b;">Wire / Bank Transfer Details</p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;"><strong>Bank:</strong> ${invoice.bankName || "N/A"}</p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;"><strong>Beneficiary:</strong> ${invoice.bankAccountName || senderName}</p>
        <p style="margin: 0; font-size: 12px; color: #334155; font-family: monospace;"><strong>Account / IBAN:</strong> ${invoice.bankAccountNumber || "N/A"}</p>
      </div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background-color: #0f172a; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">${senderName}</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Client Software Operations Controller</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; font-family: monospace; font-size: 12px; font-weight: 700; color: #38bdf8;">
            ${invoice.invoiceNumber}
          </span>
        </div>
      </div>
    </div>

    <!-- Body Content -->
    <div style="padding: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155;">
        Dear <strong>${invoice.receiverName}</strong>,
      </p>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.5;">
        Please find your invoice <strong>${invoice.invoiceNumber}</strong> attached to this email. You can review the breakdown below or refer to the attached official PDF document.
      </p>

      ${
        customMessage
          ? `
      <div style="margin: 16px 0; padding: 12px 16px; background-color: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; font-size: 13px; color: #1e40af;">
        ${customMessage}
      </div>`
          : ""
      }

      <!-- Invoice Summary Meta -->
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px;">
        <tr>
          <td style="padding: 12px; color: #64748b;">Issue Date:</td>
          <td style="padding: 12px; font-weight: 600; color: #1e293b; text-align: right;">${formatDate(invoice.issueDate)}</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 12px; color: #64748b;">Due Date:</td>
          <td style="padding: 12px; font-weight: 700; color: #dc2626; text-align: right;">${formatDate(invoice.dueDate)}</td>
        </tr>
        <tr style="border-top: 1px solid #e2e8f0;">
          <td style="padding: 12px; color: #64748b;">Total Balance Due:</td>
          <td style="padding: 12px; font-weight: 800; font-family: monospace; font-size: 15px; color: #0f172a; text-align: right;">
            ${formatCurrency(invoice.totalAmount, invoice.currency)}
          </td>
        </tr>
      </table>

      <!-- Items Breakdown -->
      ${
        (invoice.items || []).length > 0
          ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
            <th style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #64748b;">Item</th>
            <th style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: center;">Qty</th>
            <th style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right;">Price</th>
            <th style="padding: 8px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>`
          : ""
      }

      ${bankInfoHtml}

      ${
        invoice.notes
          ? `<p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; font-style: italic;">
               Note: ${invoice.notes}
             </p>`
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">This email and the attached invoice were generated automatically by ${senderName}.</p>
      <p style="margin: 4px 0 0 0;">Please keep a copy for your financial records.</p>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Sends an invoice email with attached PDF via Resend
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{
  success: boolean;
  messageId?: string;
}> {
  if (!resend) {
    throw new Error(
      "Resend API key is not configured. Please set RESEND_API_KEY in your environment (.env)."
    );
  }

  const { invoice, recipientEmail, pdfBuffer, customMessage, companyName } = params;
  const senderName = companyName || invoice.senderName || "Billing Operations";
  const fromAddress = env.EMAIL_FROM || `${senderName} <onboarding@resend.dev>`;

  const buffer = Buffer.isBuffer(pdfBuffer)
    ? pdfBuffer
    : Buffer.from(pdfBuffer);

  const response = await resend.emails.send({
    from: fromAddress,
    to: [recipientEmail],
    subject: `Invoice ${invoice.invoiceNumber} from ${senderName}`,
    html: renderInvoiceEmailHtml({
      invoice,
      customMessage,
      senderName,
    }),
    attachments: [
      {
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: buffer,
      },
    ],
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    success: true,
    messageId: response.data?.id,
  };
}

export interface SendPasswordResetEmailParams {
  recipientEmail: string;
  recipientName?: string | null;
  resetUrl: string;
  companyName?: string;
}

/**
 * Sends a secure password reset link to a client
 */
export async function sendPasswordResetEmail(params: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  messageId?: string;
}> {
  const { recipientEmail, recipientName, resetUrl, companyName } = params;
  const senderName = companyName || "Client Billing Operations";
  const fromAddress = env.EMAIL_FROM || `${senderName} <onboarding@resend.dev>`;

  if (!resend) {
    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET EMAIL SIMULATION]`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log(`(Set RESEND_API_KEY to send real emails)`);
    console.log(`======================================================\n`);
    return { success: true, messageId: "simulated-dev-id" };
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background-color: #0f172a; color: #ffffff;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 700;">${senderName}</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Client Portal Security</p>
    </div>
    <div style="padding: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155;">
        Hello${recipientName ? ` <strong>${recipientName}</strong>` : ""},
      </p>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
        We received a request to reset the password for your Client Portal account. Click the secure button below to choose a new password. This link is valid for <strong>1 hour</strong>.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
          Reset Password
        </a>
      </div>
      <p style="margin: 20px 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.4;">
        If you didn't request a password reset, you can safely ignore this email. Your password will not change.
      </p>
      <p style="margin: 0; font-size: 11px; color: #94a3b8; word-break: break-all;">
        Or copy and paste this link in your browser:<br/>
        <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
      </p>
    </div>
    <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">Automated security notification from ${senderName}.</p>
    </div>
  </div>
</body>
</html>
  `;

  const response = await resend.emails.send({
    from: fromAddress,
    to: [recipientEmail],
    subject: `Reset your Client Portal password - ${senderName}`,
    html,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    success: true,
    messageId: response.data?.id,
  };
}

export interface SendPortalInvitationEmailParams {
  recipientEmail: string;
  recipientName?: string | null;
  setupUrl: string;
  companyName?: string;
}

/**
 * Generates an operational, CSOC-branded HTML template for portal activation & password setup
 */
export function renderPortalInvitationEmailHtml(params: {
  recipientName?: string | null;
  setupUrl: string;
  senderName: string;
}): string {
  const { recipientName, setupUrl, senderName } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Your Client Portal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background-color: #0f172a; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">${senderName}</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Client Software Operations Controller</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; font-family: monospace; font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase;">
            Portal Invitation
          </span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155;">
        Hello${recipientName ? ` <strong>${recipientName}</strong>` : ""},
      </p>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.6;">
        Your Client Portal account for <strong>${senderName}</strong> has been enabled. Through your self-service portal, you can:
      </p>

      <div style="margin: 16px 0; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; color: #334155;">
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Review real-time billing history and download official invoices</li>
          <li>Upload bank wire transfer receipts for instant operator verification</li>
          <li>Inspect active software licenses, domain bindings, and service SLAs</li>
        </ul>
      </div>

      <p style="margin: 16px 0 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
        To activate your access, please click the secure button below to choose your password and sign in:
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${setupUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
          Set Password & Access Portal
        </a>
      </div>

      <p style="margin: 20px 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.4;">
        This invitation link is valid for <strong>24 hours</strong>. For security purposes, choose a strong password with at least 8 characters.
      </p>

      <p style="margin: 0; font-size: 11px; color: #94a3b8; word-break: break-all;">
        If the button does not work, copy and paste this link into your browser:<br/>
        <a href="${setupUrl}" style="color: #2563eb;">${setupUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">Automated portal access dispatch from ${senderName}.</p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Sends a portal invitation email with secure password setup link to a client
 */
export async function sendPortalInvitationEmail(params: SendPortalInvitationEmailParams): Promise<{
  success: boolean;
  messageId?: string;
}> {
  const { recipientEmail, recipientName, setupUrl, companyName } = params;
  const senderName = companyName || "Client Billing Operations";
  const fromAddress = env.EMAIL_FROM || `${senderName} <onboarding@resend.dev>`;

  if (!resend) {
    console.log(`\n======================================================`);
    console.log(`[PORTAL INVITATION EMAIL SIMULATION]`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Client Name: ${recipientName || "N/A"}`);
    console.log(`Setup Link: ${setupUrl}`);
    console.log(`(Set RESEND_API_KEY to send real emails)`);
    console.log(`======================================================\n`);
    return { success: true, messageId: "simulated-dev-id" };
  }

  const html = renderPortalInvitationEmailHtml({
    recipientName,
    setupUrl,
    senderName,
  });

  const response = await resend.emails.send({
    from: fromAddress,
    to: [recipientEmail],
    subject: `Welcome to your Client Portal - Set Your Password | ${senderName}`,
    html,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    success: true,
    messageId: response.data?.id,
  };
}

