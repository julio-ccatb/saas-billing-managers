/**
 * Helper to normalize domain strings (e.g. "https://api.myclient.com:3000/path" -> "myclient.com" or "api.myclient.com")
 */
export function cleanDomain(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const withProtocol = trimmed.includes("://") ? trimmed : `http://${trimmed}`;
    const url = new URL(withProtocol);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return raw.trim().toLowerCase().replace(/^www\./, "");
  }
}

/**
 * Validates whether the incoming origin domain matches the license's configured allowedDomain.
 * - If no allowedDomain is set on the license, any origin is permitted.
 * - If allowedDomain is set, incomingDomain must be provided and must match:
 *   - Exact match: e.g. "app.client.com" === "app.client.com" or "client.com" === "client.com"
 *   - Subdomain match: e.g. "app.client.com" is allowed when configured domain is "client.com" (ends with ".client.com")
 * - Suffix collision protection: "evilclient.com" is rejected when configured domain is "client.com"
 */
export function isDomainAllowed(
  incomingDomain?: string | null,
  allowedConfiguredDomain?: string | null
): boolean {
  if (!allowedConfiguredDomain || !allowedConfiguredDomain.trim()) {
    return true;
  }

  const allowed = cleanDomain(allowedConfiguredDomain);
  if (!allowed) {
    return true;
  }

  const incoming = cleanDomain(incomingDomain);
  if (!incoming) {
    return false;
  }

  // Exact match
  if (incoming === allowed) {
    return true;
  }

  // Subdomain match (e.g. "api.myclient.com" matches allowed "myclient.com")
  if (incoming.endsWith(`.${allowed}`)) {
    return true;
  }

  return false;
}
