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

  if (payload.event_type !== "submission.completed") {
    return NextResponse.json(
      { message: `Ignored unsupported event type: ${payload.event_type}` },
      { status: 200 }
    );
  }

  const externalId = payload.data?.external_id?.trim();
  if (!externalId) {
    return NextResponse.json({ error: "Missing external_id in payload" }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Fetch current contract state by ID or Contract Number
      const contract = await tx.contract.findFirst({
        where: {
          OR: [{ id: externalId }, { contractNumber: externalId }],
        },
      });

      if (!contract) {
        throw new Error(`Contract not found: ${externalId}`);
      }

      // Idempotency: skip mutation if already marked signed and active
      if (contract.signedAt !== null && contract.status === "ACTIVE") {
        return { contract, idempotentSkip: true };
      }

      const completedAt = new Date(payload.timestamp || Date.now());

      // 2. Update Contract record
      const updatedContract = await tx.contract.update({
        where: { id: contract.id },
        data: {
          status: "ACTIVE",
          signedAt: completedAt,
          updatedAt: new Date(),
        },
      });

      // 3. Write immutable audit log
      await tx.auditLog.create({
        data: {
          userId: contract.userId,
          operatorId: "SYSTEM_DOCUSEAL_WEBHOOK",
          action: "CONTRACT_SIGNED",
          entityType: "CONTRACT",
          entityId: contract.id,
          reason: `Document e-signed via DocuSeal submission #${payload.data.id}`,
          metadata: JSON.stringify({
            submissionId: payload.data.id,
            submitters: payload.data.submitters ?? [],
            documents: payload.data.documents ?? [],
            signedAt: completedAt.toISOString(),
          }),
        },
      });

      return { contract: updatedContract, idempotentSkip: false };
    });

    return NextResponse.json(
      { success: true, contractId: result.contract.id, idempotent: result.idempotentSkip },
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
