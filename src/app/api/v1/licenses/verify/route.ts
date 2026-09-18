import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { cleanDomain, isDomainAllowed } from "~/features/licenses/server/domainValidation";

// Helper to set CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-origin-domain",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

async function handleVerification(req: NextRequest) {
  try {
    let key: string | null = null;
    let originDomain: string | null = null;

    // 1. Extract Key from Authorization header (Bearer lic_live_...)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      key = authHeader.substring(7).trim();
    }

    // 2. Extract Key from x-api-key header
    if (!key) {
      key = req.headers.get("x-api-key")?.trim() ?? null;
    }

    // 3. Extract from Query params or Body
    const url = new URL(req.url);
    if (!key) {
      key = url.searchParams.get("key")?.trim() ?? null;
    }

    originDomain = cleanDomain(
      req.headers.get("x-origin-domain") ||
        url.searchParams.get("originDomain") ||
        url.searchParams.get("domain") ||
        req.headers.get("origin") ||
        req.headers.get("referer")
    );

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (!key && body?.key) key = String(body.key).trim();
        if (body?.originDomain || body?.domain) {
          originDomain = cleanDomain(body.originDomain || body.domain);
        }
      } catch {
        // Body was either empty or not JSON, continue with headers/query
      }
    }

    if (!key) {
      return NextResponse.json(
        {
          active: false,
          error: "License key is required. Pass via Bearer token, x-api-key header, or 'key' parameter.",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Hash the incoming key
    const incomingKeyHash = crypto.createHash("sha256").update(key).digest("hex");

    // Find license in database
    const license = await db.license.findUnique({
      where: { keyHash: incomingKeyHash },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!license || license.status === "REVOKED") {
      return NextResponse.json(
        {
          active: false,
          status: "REVOKED",
          reason: "License key is invalid or has been permanently revoked.",
        },
        { status: 401, headers: corsHeaders() }
      );
    }

    // Domain validation check if allowedDomain is configured on the license
    if (license.allowedDomain && !isDomainAllowed(originDomain, license.allowedDomain)) {
      return NextResponse.json(
        {
          active: false,
          status: "DOMAIN_MISMATCH",
          reason: originDomain
            ? `Origin domain '${originDomain}' does not match authorized domain '${license.allowedDomain}'.`
            : `Origin domain is required when an allowed domain is configured ('${license.allowedDomain}'). Please provide via 'x-origin-domain' header, 'Origin' header, or 'originDomain' parameter.`,
        },
        { status: 403, headers: corsHeaders() }
      );
    }

    // Update telemetry (non-blocking for speed)
    await db.license.update({
      where: { id: license.id },
      data: {
        lastCheckedAt: new Date(),
        lastCheckedIp: clientIp,
        checkCount: { increment: 1 },
      },
    });

    // If SUSPENDED by administrator
    if (license.status === "SUSPENDED") {
      return NextResponse.json(
        {
          active: false,
          status: "SUSPENDED",
          serviceName: license.name,
          reason:
            license.suspensionNotice?.trim() ||
            "Service temporarily suspended by administrator. Please contact billing support.",
          leaseExpiresAt: new Date().toISOString(),
          checkedAt: new Date().toISOString(),
        },
        { status: 200, headers: corsHeaders() }
      );
    }

    // If ACTIVE: issue short cached lease
    const leaseTtlMinutes = license.leaseTtlMinutes || 60;
    const leaseExpiresAt = new Date(Date.now() + leaseTtlMinutes * 60 * 1000).toISOString();

    return NextResponse.json(
      {
        active: true,
        status: "ACTIVE",
        serviceName: license.name,
        customerName: license.customer?.name || null,
        leaseExpiresAt,
        nextCheckInSeconds: leaseTtlMinutes * 60,
        gracePeriodHours: license.gracePeriodHours || 3,
        checkedAt: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error("License verification error:", error);
    return NextResponse.json(
      {
        active: false,
        error: "Internal server error verifying license",
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleVerification(req);
}

export async function POST(req: NextRequest) {
  return handleVerification(req);
}
