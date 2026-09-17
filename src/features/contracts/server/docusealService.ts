import { DocusealApi } from "@docuseal/api";
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

export function getDocuSealClient() {
  const host = (env.DOCUSEAL_API_URL ?? process.env.DOCUSEAL_API_URL ?? "https://lg.jcodea.com").replace(/\/+$/, "");
  const key = env.DOCUSEAL_API_KEY ?? process.env.DOCUSEAL_API_KEY;

  if (!key) {
    throw new Error("DOCUSEAL_API_KEY is not configured in .env");
  }

  // Ensure self-hosted DocuSeal endpoints target /api
  const url = host.endsWith("/api") ? host : `${host}/api`;

  return {
    client: new DocusealApi({ key, url }),
    hostUrl: host,
  };
}

/**
 * Creates a DocuSeal submission using official @docuseal/api SDK,
 * fills template variables, and returns the verified client signing URL.
 */
export async function createDynamicDocuSealSubmission(params: SendContractSubmissionParams) {
  const { client, hostUrl } = getDocuSealClient();

  const rawTemplateId = params.templateId || env.DOCUSEAL_TEMPLATE_ID || process.env.DOCUSEAL_TEMPLATE_ID || 3;
  const templateId = Number(rawTemplateId);

  if (isNaN(templateId)) {
    throw new Error(`Invalid DocuSeal Template ID: ${rawTemplateId}`);
  }

  // Format currency & dates
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: params.contract.currency || "USD",
  }).format(params.contract.value);

  const formattedDate = new Date(params.contract.startDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const vendorName = params.companyProfile?.companyName || "Service Provider";
  const vendorEmail = params.companyProfile?.email || "";
  const vendorPhone = params.companyProfile?.phone || "";
  const vendorAddress = params.companyProfile?.address || "";
  const vendorTaxId = params.companyProfile?.taxId || "";
  const vendorSignature = params.companyProfile?.signatureData || "";

  // Common field values mapped for template placeholders
  const commonValues: Record<string, any> = {
    // Client fields
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

    // Vendor fields
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

  // Inspect template submitter roles
  let templateRoles: string[] = ["Client"];
  try {
    const template = (await client.getTemplate(templateId)) as any;
    if (Array.isArray(template?.submitters)) {
      templateRoles = template.submitters.map((s: { name: string }) => s.name);
    } else if (Array.isArray(template?.roles)) {
      templateRoles = template.roles;
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

  const submittersPayload: Array<any> = [];

  // 1. Client Submitter
  submittersPayload.push({
    role: clientRoleName,
    email: params.customer.email || "test@example.com",
    name: params.customer.name || "Client Signer",
    external_id: params.contract.contractNumber,
    send_email: false,
    values: { ...commonValues },
  });

  // 2. Vendor Submitter (if template includes a secondary Vendor role)
  if (vendorRoleName && vendorRoleName !== clientRoleName) {
    const vendorValues: Record<string, any> = {
      ...commonValues,
      vendor_sign_date: todayFormatted,
      vendor_date: todayFormatted,
      sign_date: todayFormatted,
      date: todayFormatted,
      ...(vendorSignature
        ? {
            vendor_signature: vendorSignature,
            signature: vendorSignature,
            provider_signature: vendorSignature,
          }
        : {}),
    };

    submittersPayload.push({
      role: vendorRoleName,
      email: vendorEmail || "vendor@example.com",
      name: vendorName,
      send_email: false,
      values: vendorValues,
    });
  }

  // Execute submission via @docuseal/api SDK with send_email: false
  // All signature invitation emails are routed exclusively through Resend
  const submissionRes = (await client.createSubmission({
    template_id: templateId,
    external_id: params.contract.contractNumber,
    send_email: false,
    submitters: submittersPayload,
  } as any)) as any;

  const submittersList = Array.isArray(submissionRes?.submitters)
    ? submissionRes.submitters
    : Array.isArray(submissionRes)
    ? submissionRes
    : [];

  const clientSubmitter =
    submittersList.find((s: any) => s.email?.toLowerCase() === params.customer.email?.toLowerCase()) ||
    submittersList.find((s: any) => /client|customer|second/i.test(s.role || "")) ||
    submittersList[0];

  const submissionId = Number(submissionRes.id || clientSubmitter?.submission_id);
  const clientSlug = clientSubmitter?.slug;

  if (!clientSlug) {
    throw new Error(
      `DocuSeal submission succeeded (ID: ${submissionId}) but client signing slug was not returned.`
    );
  }

  const signingUrl = clientSubmitter?.embed_src || `${hostUrl}/s/${clientSlug}`;

  return {
    submissionId,
    slug: clientSlug,
    signingUrl,
    submitterId: clientSubmitter?.id,
    customerEmail: params.customer.email,
  };
}

/**
 * Fetches the current live status and documents for a DocuSeal submission
 * using the official @docuseal/api SDK.
 */
export async function getDocuSealSubmission(submissionId: number) {
  const { client } = getDocuSealClient();

  const submission = (await client.getSubmission(submissionId)) as any;

  return {
    id: Number(submission.id),
    status: (submission.status as string) || "pending",
    slug: (submission.slug as string) || "",
    documents: (submission.documents as Array<{ name: string; url: string }>) || [],
    submitters: (submission.submitters as Array<any>) || [],
  };
}
