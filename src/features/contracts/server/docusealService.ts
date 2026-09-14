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

  const values: Record<string, any> = {
    client_name: params.customer.name,
    client_email: params.customer.email,
    client_phone: params.customer.phone || "",
    client_address: params.customer.address || "",
    client_tax_id: params.customer.taxId || "",
    vendor_name: params.companyProfile?.companyName || "Service Provider",
    contract_number: params.contract.contractNumber,
    contract_title: params.contract.title,
    contract_value: formattedValue,
    billing_cycle: params.contract.billingCycle,
    start_date: formattedDate,
    sla_terms: params.contract.terms || "",
  };

  let payload: Record<string, any>;

  if (templateId) {
    // When Template ID is provided, send template_id with external_id and submitters
    payload = {
      template_id: templateId,
      external_id: params.contract.contractNumber,
      submitters: [
        {
          role: "Client",
          email: params.customer.email || "test@example.com",
          name: params.customer.name || "Client Signer",
          values,
        },
      ],
    };
  } else {
    // Fallback: Use dynamic HTML document if no template ID is specified
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>body{font-family:sans-serif;margin:40px;line-height:1.6;color:#111827}.title{font-size:20px;font-weight:bold}.box{background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:16px 0}</style></head>
<body>
  <div class="title">${params.contract.title}</div>
  <p>Contract Number: <strong>${params.contract.contractNumber}</strong></p>
  <div class="box">
    <strong>Client:</strong> ${params.customer.name} (${params.customer.email})<br/>
    <strong>Value:</strong> ${formattedValue} / ${params.contract.billingCycle.toLowerCase()}<br/>
    <strong>Effective Date:</strong> ${formattedDate}
  </div>
  ${params.contract.terms ? `<div class="box"><strong>Terms:</strong><br/>${params.contract.terms}</div>` : ""}
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;">
    <p>Please sign below:</p>
    {{Sign Here;role=Client;type=signature}}<br/>
    Name: {{Signer Name;role=Client;type=text}}<br/>
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
  const submitter = data.submitters?.[0];
  const signingUrl = submitter?.embed_url || (submitter?.slug ? `${apiUrl}/s/${submitter.slug}` : `${apiUrl}/s/${data.slug}`);

  return {
    submissionId: data.id,
    slug: data.slug,
    signingUrl,
    submitterId: submitter?.id,
  };
}
