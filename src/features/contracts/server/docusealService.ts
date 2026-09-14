import { env } from "~/env";

interface SendContractSubmissionParams {
  templateId?: string | number | null;
  contract: {
    id: string;
    contractNumber: string;
    title: string;
    value: number;
    currency: string;
    billingCycle: string;
    startDate: Date;
    endDate?: Date | null;
    terms?: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxId?: string;
  };
  companyProfile?: {
    companyName?: string;
    email?: string;
    phone?: string;
    taxId?: string;
    address?: string;
    signatureData?: string | null;
  } | null;
}

interface DocuSealSubmissionResponse {
  id: number;
  slug: string;
  source: string;
  submitters: Array<{
    id: number;
    slug: string;
    email: string;
    name: string;
    embed_url?: string;
    status: string;
  }>;
}

/**
 * Creates a DocuSeal submission using either a specified DocuSeal Template ID
 * or dynamic contract data, and returns the interactive signing link.
 */
export async function createDynamicDocuSealSubmission(params: SendContractSubmissionParams) {
  const apiUrl = (env.DOCUSEAL_API_URL ?? process.env.DOCUSEAL_API_URL ?? "https://lg.jcodea.com").replace(/\/+$/, "");
  const apiKey = env.DOCUSEAL_API_KEY ?? process.env.DOCUSEAL_API_KEY;

  if (!apiKey) {
    throw new Error("DOCUSEAL_API_KEY is not configured in .env");
  }

  const rawTemplateId = params.templateId || env.DOCUSEAL_TEMPLATE_ID || process.env.DOCUSEAL_TEMPLATE_ID;
  const templateId = rawTemplateId ? (isNaN(Number(rawTemplateId)) ? rawTemplateId : Number(rawTemplateId)) : null;

  // Build standard submitter payload with client info & values
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: params.contract.currency || "USD",
  }).format(params.contract.value);

  const formattedDate = new Date(params.contract.startDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const vendorName = params.companyProfile?.companyName || "Service Provider";
  const vendorEmail = params.companyProfile?.email || "";
  const vendorPhone = params.companyProfile?.phone || "";
  const vendorAddress = params.companyProfile?.address || "";
  const vendorTaxId = params.companyProfile?.taxId || "";

  const values: Record<string, any> = {
    // Client fields & common aliases
    client_name: params.customer.name,
    customer_name: params.customer.name,
    client_email: params.customer.email,
    customer_email: params.customer.email,
    client_phone: params.customer.phone || "",
    customer_phone: params.customer.phone || "",
    client_address: params.customer.address || "",
    customer_address: params.customer.address || "",
    client_tax_id: params.customer.taxId || "",
    customer_tax_id: params.customer.taxId || "",

    // Vendor / Provider fields & common aliases
    vendor_name: vendorName,
    company_name: vendorName,
    provider_name: vendorName,
    organization_name: vendorName,
    vendor_email: vendorEmail,
    company_email: vendorEmail,
    provider_email: vendorEmail,
    vendor_phone: vendorPhone,
    company_phone: vendorPhone,
    vendor_address: vendorAddress,
    company_address: vendorAddress,
    vendor_tax_id: vendorTaxId,
    company_tax_id: vendorTaxId,

    // Contract Scope & Terms
    contract_number: params.contract.contractNumber,
    contract_title: params.contract.title,
    contract_value: formattedValue,
    value: formattedValue,
    billing_cycle: params.contract.billingCycle,
    cycle: params.contract.billingCycle,
    start_date: formattedDate,
    effective_date: formattedDate,
    sla_terms: params.contract.terms || "",
    terms: params.contract.terms || "",
  };

  let payload: Record<string, any>;

  if (templateId) {
    // If a template is specified, check if it has multiple roles (e.g. Client + Vendor)
    let templateRoles: string[] = ["Client"];
    try {
      const tmplRes = await fetch(`${apiUrl}/api/templates/${templateId}`, {
        headers: { "X-Auth-Token": apiKey },
      });
      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        if (Array.isArray(tmplData.submitters)) {
          templateRoles = tmplData.submitters.map((s: { name: string }) => s.name);
        } else if (Array.isArray(tmplData.roles)) {
          templateRoles = tmplData.roles;
        }
      }
    } catch {
      // Fallback to standard Client/Vendor role assumptions
    }

    const vendorRoleName = templateRoles.find((r) =>
      /vendor|provider|first[_\s-]?party|owner|issuer/i.test(r)
    ) || (templateRoles.includes("Vendor") ? "Vendor" : null);

    const clientRoleName = templateRoles.find((r) =>
      /client|customer|second[_\s-]?party|signer/i.test(r)
    ) || templateRoles[0] || "Client";

    const submitters: Array<Record<string, any>> = [];

    // Client Submitter
    const clientValues: Record<string, any> = { ...values };
    submitters.push({
      role: clientRoleName,
      email: params.customer.email || "test@example.com",
      name: params.customer.name || "Client Signer",
      values: clientValues,
    });

    // Vendor Submitter (if template includes a Vendor / Service Provider role)
    if (vendorRoleName && vendorRoleName !== clientRoleName) {
      const todayFormatted = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      const vendorSignature = params.companyProfile?.signatureData || "";

      const vendorValues: Record<string, any> = {
        vendor_name: vendorName,
        vendor_email: vendorEmail || "vendor@example.com",
        vendor_phone: vendorPhone,
        vendor_address: vendorAddress,
        vendor_tax_id: vendorTaxId,
        company_name: vendorName,
        company_email: vendorEmail,
        company_phone: vendorPhone,
        company_address: vendorAddress,
        company_tax_id: vendorTaxId,

        // Signing Date
        vendor_sign_date: todayFormatted,
        vendor_date: todayFormatted,
        sign_date: todayFormatted,
        date: todayFormatted,

        // Vendor Signature (DocuSeal accepts data:image/png;base64,... for signature fields)
        ...(vendorSignature
          ? {
              vendor_signature: vendorSignature,
              signature: vendorSignature,
              provider_signature: vendorSignature,
            }
          : {}),
      };

      submitters.push({
        role: vendorRoleName,
        email: vendorEmail || "vendor@example.com",
        name: vendorName,
        values: vendorValues,
      });
    }

    payload = {
      template_id: templateId,
      external_id: params.contract.contractNumber,
      submitters,
    };
  } else {
    // Fallback: Use dynamic HTML document if no template ID is specified
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; line-height: 1.6; color: #111827; }
    .title { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    .grid { display: flex; justify-content: space-between; gap: 20px; margin: 24px 0; }
    .box { flex: 1; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; }
    .box-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="title">${params.contract.title}</div>
  <p style="color:#64748b;font-family:monospace;margin:0;">Reference: ${params.contract.contractNumber}</p>

  <div class="grid">
    <div class="box">
      <div class="box-title">Vendor / Service Provider</div>
      <strong>${vendorName}</strong><br/>
      ${vendorEmail ? `Email: ${vendorEmail}<br/>` : ""}
      ${vendorPhone ? `Phone: ${vendorPhone}<br/>` : ""}
      ${vendorAddress ? `Address: ${vendorAddress}<br/>` : ""}
      ${vendorTaxId ? `Tax ID: ${vendorTaxId}` : ""}
    </div>

    <div class="box">
      <div class="box-title">Client / Subscriber</div>
      <strong>${params.customer.name}</strong><br/>
      ${params.customer.email ? `Email: ${params.customer.email}<br/>` : ""}
      ${params.customer.phone ? `Phone: ${params.customer.phone}<br/>` : ""}
      ${params.customer.address ? `Address: ${params.customer.address}<br/>` : ""}
      ${params.customer.taxId ? `Tax ID: ${params.customer.taxId}` : ""}
    </div>
  </div>

  <div class="box">
    <div class="box-title">Commercial Terms</div>
    <strong>Agreed Value:</strong> ${formattedValue} / ${params.contract.billingCycle.toLowerCase()}<br/>
    <strong>Effective Date:</strong> ${formattedDate}
  </div>

  ${params.contract.terms ? `<div class="box"><div class="box-title">SLA & Terms</div>${params.contract.terms}</div>` : ""}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
    <p><strong>Signatures & Acceptance</strong></p>
    <div style="margin-bottom: 15px;">
      {{Sign Here;role=Client;type=signature}}
    </div>
    Signer Name: {{Signer Name;role=Client;type=text}}<br/>
    Signer Title: {{Signer Title;role=Client;type=text}}<br/>
    Date: {{Date;role=Client;type=date}}
  </div>
</body>
</html>`.trim();

    payload = {
      name: `${params.contract.title} - ${params.customer.name}`,
      external_id: params.contract.contractNumber,
      documents: [
        {
          name: `${params.contract.contractNumber}.pdf`,
          html,
        },
      ],
      submitters: [
        {
          role: "Client",
          email: params.customer.email || "test@example.com",
          name: params.customer.name || "Client Signer",
        },
      ],
    };
  }

  const response = await fetch(`${apiUrl}/api/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DocuSeal API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as DocuSealSubmissionResponse;
  // Pick the client submitter specifically so the signing link is the customer's link
  const clientSubmitter =
    data.submitters?.find((s) => s.email?.toLowerCase() === params.customer.email?.toLowerCase()) ||
    data.submitters?.find((s) => /client|customer|second/i.test((s as any).role || "")) ||
    data.submitters?.[0];

  const signingUrl = clientSubmitter?.embed_url || (clientSubmitter?.slug ? `${apiUrl}/s/${clientSubmitter.slug}` : `${apiUrl}/s/${data.slug}`);

  return {
    submissionId: data.id,
    slug: data.slug,
    signingUrl,
    submitterId: clientSubmitter?.id,
  };
}
