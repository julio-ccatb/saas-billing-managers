# Technical Design: License Management & Remote Service Kill-Switch

## 1. Overview & Objectives

Invoify SaaS Billing Manager provides invoicing and customer tracking. This feature introduces a **License Management Subsystem** with remote enforcement / kill-switch capabilities. 

When clients fail to pay invoices or when services need administrative suspension, the system owner can immediately deactivate client websites and backend services with a 1-click toggle.

Client systems communicate with Invoify using a lightweight **REST API** using a **Short Cached Lease** architecture (1-hour lease + 3-hour fail-safe grace window) to guarantee immediate deactivation upon lease expiry while protecting paying clients from unexpected billing server downtime.

---

## 2. Architecture & Data Model

### 2.1 Database Schema (`prisma/schema.prisma`)

Add the `License` model and establish relations with `User` and `Customer`:

```prisma
model License {
  id               String    @id @default(cuid())
  userId           String
  customerId       String?
  name             String              // e.g. "Acme Corp Production Portal"
  key              String    @unique   // e.g. "lic_live_4a8b7f20c91e3d5a..."
  status           String    @default("ACTIVE") // "ACTIVE" | "SUSPENDED" | "REVOKED"
  allowedDomain    String?             // e.g. "acmeproductions.com" (optional restriction)
  suspensionNotice String?             // Custom notice returned when status is SUSPENDED
  leaseTtlMinutes  Int       @default(60)       // Default lease duration in minutes
  gracePeriodHours Int       @default(3)        // Downtime tolerance window
  lastCheckedAt    DateTime?           // Timestamp of most recent verification call
  lastCheckedIp    String?             // IP address of the client application
  checkCount       Int       @default(0)        // Total verification pings received
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  customer         Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)

  @@index([userId, status])
  @@index([key])
}
```

Add relations to existing models:
- In `model User`: `licenses License[]`
- In `model Customer`: `licenses License[]`

---

## 3. Key Generation & Cryptography

- **Format**: `lic_live_` prefix followed by 32 cryptographically secure random bytes (64 hex characters):
  ```typescript
  import crypto from "crypto";

  export function generateLicenseKey(): string {
    return `lic_live_${crypto.randomBytes(32).toString("hex")}`;
  }
  ```
- Keys are unique in the database.
- Key regeneration preserves the record ID, customer relation, and statistics while invalidating the previous key.

---

## 4. Verification Engine & REST API

### 4.1 Endpoint: `POST /api/v1/licenses/verify` (and `GET /api/v1/licenses/verify`)

#### Authentication:
- `Authorization: Bearer <license_key>` OR
- `x-api-key: <license_key>` OR
- JSON body / query string: `key=<license_key>`

#### Request Payload / Headers:
- `originDomain` (string, optional - read from body or `Origin`/`Referer` header)

#### Verification Logic:
1. Extract and sanitize key.
2. Find license by `key`.
3. If license does not exist or `status === "REVOKED"`:
   - Return HTTP `401 Unauthorized` with `{ "active": false, "status": "REVOKED", "reason": "Invalid or revoked license key." }`
4. If `allowedDomain` is configured and does not match `originDomain`:
   - Return HTTP `403 Forbidden` with `{ "active": false, "status": "DOMAIN_MISMATCH", "reason": "Origin domain not authorized for this license." }`
5. If `status === "SUSPENDED"`:
   - Return HTTP `200 OK` with:
     ```json
     {
       "active": false,
       "status": "SUSPENDED",
       "serviceName": "Acme Portal",
       "reason": "Administrative suspension. Contact billing.",
       "leaseExpiresAt": "2026-09-12T19:00:00.000Z"
     }
     ```
6. If `status === "ACTIVE"`:
   - Update `lastCheckedAt = new Date()`, `checkCount += 1`, `lastCheckedIp = clientIp`.
   - Calculate `leaseExpiresAt = now + (leaseTtlMinutes * 60 * 1000)`.
   - Return HTTP `200 OK` with:
     ```json
     {
       "active": true,
       "status": "ACTIVE",
       "serviceName": "Acme Portal",
       "leaseExpiresAt": "2026-09-12T20:00:00.000Z",
       "nextCheckInSeconds": 3600,
       "gracePeriodHours": 3
     }
     ```

---

## 5. Dashboard UI & Workflows (`/licenses`)

Following craft-first `interface-design` principles:
- **Quiet structure**: Minimal borders, clean surface layering.
- **Unmistakable hierarchy**: Instant focus on Active vs Suspended states.
- **Tactile states**: Responsive transitions on kill-switch toggles.

### 5.1 Telemetry Overview Bar
- **Active Services**: Emerald indicator + count.
- **Suspended Services**: Amber/rose indicator highlighting services needing payment collection.
- **Total Verifications**: Tabular-numeric counter of API requests.
- **Quick Action**: `+ Issue License Key` button.

### 5.2 Licenses Data Table
- **Columns**:
  1. **Service / Project**: Bold name, linked customer name below.
  2. **API Key**: Monospace masked key (`lic_live_...9f2a`) with copy icon and tooltip.
  3. **Domain Binding**: Clean badge with allowed domain or "Any Domain".
  4. **Last Check-in**: Relative timestamp with live status dot (pulse on recent check-in).
  5. **Kill-Switch (Focal Element)**: Instant toggle button between **Active** (emerald) and **Suspended** (rose).
  6. **Actions**:
     - *Integration Snippet*: Drawer with copy-paste code for Node.js, Next.js, Python, PHP.
     - *Edit Notice*: Modal to update custom suspension message.
     - *Regenerate Key*: Key rotation with confirmation modal.
     - *Revoke*: Permanent cancellation.

### 5.3 Issue New License Modal
- Fields: Service Name, Customer (optional selector), Allowed Domain (optional), Custom Suspension Notice (optional).
- On success: Modal reveals generated secret key with copy button and instructions.

### 5.4 Integration Snippet Drawer
- Provides a clean, drop-in snippet for client developers implementing the 1-hour lease check in their application backend.

---

## 6. Testing & Validation Strategy

1. **Unit Tests**: Key generation entropy and uniqueness tests.
2. **API Route Tests**:
   - Valid key returns `active: true` with valid `leaseExpiresAt`.
   - Suspended key returns `active: false` with custom suspension notice.
   - Domain mismatch returns `active: false` and `DOMAIN_MISMATCH`.
   - Revoked or missing key returns `401`.
3. **UI Interaction Verification**:
   - Toggling kill-switch immediately mutates database and updates badge.
   - Creating, copying, regenerating, and revoking keys.
