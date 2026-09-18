"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { Code2, Copy, Check } from "lucide-react";

interface CodeSnippetDrawerProps {
  license: any | null;
  onClose: () => void;
}

export function CodeSnippetDrawer({ license, onClose }: CodeSnippetDrawerProps) {
  const [activeTab, setActiveTab] = useState<"trpc" | "node" | "nextjs" | "python" | "php">("trpc");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const snippet = license ? getCodeSnippet(activeTab, license.key) : "";

  const handleCopy = () => {
    if (!snippet) return;
    void navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <Sheet open={!!license} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-card border-border">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <span>Telemetry &amp; Enforcement SDK</span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Embed this zero-latency verification logic into <strong>{license?.name}</strong>.
          </p>
        </SheetHeader>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg overflow-x-auto">
            {(["trpc", "nextjs", "node", "python", "php"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "trpc" ? "tRPC (Next.js)" : tab === "nextjs" ? "Next.js Edge" : tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="absolute right-3 top-3 h-8 px-2.5 text-xs gap-1 z-10"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? "Copied" : "Copy"}</span>
            </Button>
            <pre className="p-4 rounded-xl bg-muted/60 border border-border font-mono text-xs overflow-x-auto text-foreground leading-relaxed">
              <code>{snippet}</code>
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getCodeSnippet(lang: string, key: string): string {
  const endpoint = "http://localhost:3000/api/v1/licenses/verify";

  switch (lang) {
    case "trpc":
      return `import { TRPCError } from "@trpc/server";

interface LicensePayload {
  active: boolean;
  status?: "ACTIVE" | "SUSPENDED" | "DOMAIN_MISMATCH" | "REVOKED" | string;
  reason?: string;
  error?: string;
  serviceName?: string;
  leaseExpiresAt?: string;
  checkedAt?: string;
}

let cachedLicense: LicensePayload | null = null;

export const verifyLicense = t.middleware(async ({ ctx, next }) => {
  const licenseUrl = process.env.LICENSE_SERVER_URL ?? "${endpoint}";
  const licenseKey = process.env.LIC_KEY ?? "${key}";
  const now = Date.now();
  const leaseEnd = cachedLicense?.leaseExpiresAt
    ? new Date(cachedLicense.leaseExpiresAt).getTime()
    : 0;

  if (cachedLicense?.active && leaseEnd > now) {
    return next({ ctx: { ...ctx, license: cachedLicense } });
  }

  let payload: LicensePayload | null = null;
  let isNetworkFailure = false;

  try {
    const res = await fetch(licenseUrl, {
      method: "GET",
      headers: {
        Authorization: \`Bearer \${licenseKey}\`,
        "x-origin-domain": process.env.APP_DOMAIN ?? "",
      },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });

    if ([200, 400, 401, 403].includes(res.status)) {
      payload = (await res.json()) as LicensePayload;
    } else {
      isNetworkFailure = true;
    }
  } catch {
    isNetworkFailure = true;
  }

  if (isNetworkFailure) {
    if (cachedLicense?.active && leaseEnd > now) {
      return next({ ctx: { ...ctx, license: cachedLicense } });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Licensing service unreachable and local lease grace period has expired.",
    });
  }

  if (payload?.active) {
    cachedLicense = payload;
    return next({ ctx: { ...ctx, license: payload } });
  }

  cachedLicense = null;
  const message = payload?.reason || payload?.error || "Service suspended. Contact billing.";

  switch (payload?.status) {
    case "REVOKED":
      throw new TRPCError({ code: "UNAUTHORIZED", message });
    case "DOMAIN_MISMATCH":
    case "SUSPENDED":
    default:
      throw new TRPCError({ code: "FORBIDDEN", message });
  }
});`;

    case "node":
      return `let cachedLease = null;

async function checkLicenseStatus() {
  const now = Date.now();
  if (cachedLease && now < cachedLease.expiry) {
    return cachedLease.active;
  }

  try {
    const res = await fetch("${endpoint}", {
      headers: {
        "Authorization": "Bearer ${key}",
        "x-origin-domain": process.env.APP_DOMAIN || "localhost",
      }
    });
    const data = await res.json();

    if (!data.active) {
      console.error("SERVICE SUSPENDED:", data.reason);
      return false;
    }

    cachedLease = {
      active: true,
      expiry: new Date(data.leaseExpiresAt).getTime()
    };
    return true;
  } catch (err) {
    return true;
  }
}

app.use(async (req, res, next) => {
  const isActive = await checkLicenseStatus();
  if (!isActive) {
    return res.status(402).send("Service temporarily suspended for billing review.");
  }
  next();
});`;

    case "nextjs":
      return `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const originDomain = req.nextUrl.hostname;
  const res = await fetch("${endpoint}", {
    headers: {
      "Authorization": "Bearer ${key}",
      "x-origin-domain": originDomain,
    },
    next: { revalidate: 3600 }
  });
  
  const license = await res.json();
  if (!license.active) {
    return new NextResponse(
      license.reason || "Service Suspended. Contact Billing.", 
      { status: 402 }
    );
  }
  return NextResponse.next();
}`;

    case "python":
      return `import time
import os
import requests

LICENSE_KEY = "${key}"
VERIFY_URL = "${endpoint}"
APP_DOMAIN = os.getenv("APP_DOMAIN", "example.com")

_cached_expiry = 0
_is_active = True

def verify_service_active():
    global _cached_expiry, _is_active
    now = time.time()
    
    if now < _cached_expiry:
        return _is_active
        
    try:
        resp = requests.get(
            VERIFY_URL, 
            headers={
                "Authorization": f"Bearer {LICENSE_KEY}",
                "x-origin-domain": APP_DOMAIN,
            },
            timeout=5
        )
        data = resp.json()
        _is_active = data.get("active", False)
        _cached_expiry = now + data.get("nextCheckInSeconds", 3600)
        return _is_active
    except Exception:
        return True`;

    case "php":
      return `<?php
function is_service_licensed() {
    $cache_key = 'license_lease_expiry';
    $key = "${key}";
    $url = "${endpoint}";
    $domain = $_SERVER['HTTP_HOST'] ?? 'localhost';

    if (isset($_SESSION[$cache_key]) && time() < $_SESSION[$cache_key]) {
        return true;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . $key,
        "x-origin-domain: " . $domain
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    if (!empty($data['active'])) {
        $_SESSION[$cache_key] = time() + ($data['nextCheckInSeconds'] ?? 3600);
        return true;
    }

    http_response_code(402);
    die($data['reason'] ?? "Service suspended.");
}`;

    default:
      return "";
  }
}
