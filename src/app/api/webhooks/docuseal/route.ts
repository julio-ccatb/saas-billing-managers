import { headers } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "~/server/db";
import { env } from "~/env";

interface DocuSealSubmitter {
  id: number;
  slug: string;
  email: string;
  status: string;
  external_id?: string;
  completed_at?: string;
}

interface DocuSealWebhookPayload {
  event_type: "submission.completed" | "submission.created" | "submission.declined" | string;
  data: {
    id: number;
    source?: string;
    external_id?: string;
    status?: string;
    documents?: Array<{ name: string; url: string }>;
    submitters?: DocuSealSubmitter[];
  };
  timestamp?: string;
}

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    const digestBuffer = Buffer.from(digest);
    const signatureBuffer = Buffer.from(signature);

    if (digestBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const secret = env.DOCUSEAL_WEBHOOK_SECRET ?? process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret unconfigured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-docuseal-signature") ?? (await headers()).get("x-docuseal-signature");

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: DocuSealWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  const externalId = (
    payload.data?.external_id ||
    payload.data?.submitters?.find((s: any) => s.external_id)?.external_id ||
    payload.data?.submitters?.[0]?.external_id
  )?.trim();

  if (!externalId) {
    return NextResponse.json({ error: "Missing external_id in payload" }, { status: 400 });
  }

  try {
    if (payload.event_type === "submission.completed") {
      const { processContractCompletion } = await import(
        "~/features/contracts/server/contractCompletionService"
      );

      const result = await processContractCompletion(db, {
        contractIdentifier: externalId,
        submissionId: payload.data.id,
        completedAt: new Date(payload.timestamp || Date.now()),
        documents: payload.data.documents ?? [],
        submitters: payload.data.submitters ?? [],
        operatorId: "SYSTEM_DOCUSEAL_WEBHOOK",
        createInitialInvoice: true,
      });

      return NextResponse.json(
        {
          success: true,
          contractId: result.contract.id,
          idempotent: result.idempotentSkip,
          generatedInvoiceId: result.generatedInvoiceId,
          signedDocumentUrl: result.signedDocumentUrl,
        },
        { status: 200 }
      );
    }

    if (payload.event_type === "submission.declined") {
      const contract = await db.contract.findFirst({
        where: {
          OR: [{ id: externalId }, { contractNumber: externalId }],
        },
      });

      if (contract) {
        await db.auditLog.create({
          data: {
            companyId: contract.companyId,
            userId: contract.userId,
            operatorId: "SYSTEM_DOCUSEAL_WEBHOOK",
            action: "CONTRACT_DECLINED",
            entityType: "CONTRACT",
            entityId: contract.id,
            reason: `DocuSeal submission #${payload.data.id} was declined by signer`,
            metadata: JSON.stringify({
              submissionId: payload.data.id,
              submitters: payload.data.submitters ?? [],
              declinedAt: new Date(payload.timestamp || Date.now()).toISOString(),
            }),
          },
        });
      }

      return NextResponse.json(
        { success: true, message: "Declined event recorded in audit history" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: `Ignored unhandled event type: ${payload.event_type}` },
      { status: 200 }
    );
  } catch (error: any) {
    const isNotFound = error.message?.includes("Contract not found");
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}

