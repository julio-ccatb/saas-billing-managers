# ⚡ Client Software Operations Controller (CSOC) & SaaS Billing Command Center

An enterprise-grade, high-density operations dashboard and fintech ledger designed for SaaS founders, agency owners, and software operators. Built with the **T3 Stack** (Next.js 15 App Router, React 19, tRPC v11, Prisma ORM, Tailwind CSS v4, and NextAuth/Auth.js).

---

## 🚀 Key Architectural Features

### 1. 📝 Contracts & DocuSeal e-Signature Integration
- **Dynamic Template Routing**: Send contracts using dynamic DocuSeal Template IDs or fallback to styled auto-generated contract HTML documents.
- **Multi-Role Submitter Resolution**: Automatic role discovery via DocuSeal API (`/api/templates/:id`). Seamlessly supports two-party contracts (`Client` + `Vendor` / `First Party`).
- **Vendor Pre-population**:
  - Automatically loads and maps vendor data from `CompanyProfile` and the operator's active session.
  - Injects `vendor_name`, `vendor_address`, `vendor_email`, `vendor_phone`, `vendor_tax_id`.
  - Automatically signs and stamps:
    - **`vendor_sign_date`**: Populated with the current date (`MM/DD/YYYY`).
    - **`vendor_signature`**: Automatically embeds the operator's saved base64 signature (`signatureData`).
- **Real-Time Webhook Synchronization**:
  - Secure webhook endpoint at `/api/webhooks/docuseal` with timing-safe HMAC SHA-256 signature verification.
  - Automatically transitions contract status from `DRAFT` to `ACTIVE` upon receiving `submission.completed`.
  - Stamps `signedAt` and writes an immutable entry to `AuditLog`.

---

### 2. 🔑 Software Licensing & Telemetry Engine
- **Cryptographic License Management**: CUID-based, tamper-resistant license keys tied to specific client contracts.
- **Edge Verification API (`POST /api/license/verify`)**:
  - High-performance, low-latency endpoint for distributed client software to validate their license key.
  - Domain locking (`allowedDomain`) and heartbeat telemetry (`lastCheckedAt`, `lastCheckedIp`, `checkCount`).
  - Configurable lease duration (`leaseTtlMinutes`) and offline grace periods (`gracePeriodHours`).
- **Instant Killswitch**:
  - Ability to suspend (`SUSPENDED`) or revoke (`REVOKED`) licenses immediately upon contract breach or payment failure.
  - Displays customizable suspension notices to end-users running the client app.

---

### 3. 💰 Billing & Invoicing Ledger
- **Multi-Cycle Billing**: Manage monthly, quarterly, annual, and one-time recurring contracts with auto-computed MRR.
- **High-Density Bento Ledger**: Filter invoices by `DRAFT`, `PENDING`, `PAID`, and `OVERDUE`.
- **PDF Generation**: Serverless Chromium/Puppeteer invoice rendering engine with customizable themes, currency support, and company branding.

---

### 4. 🛡️ Immutable Audit Logging & Security
- Every operational decision (suspending a client, terminating a contract, regenerating keys, or dispatching legal documents) writes an immutable record to the `AuditLog` table.
- Logs capture the operator ID, target entity, timestamp, IP address, and explicit operational rationale.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Turbopack)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first, OKLCH color space), [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
- **API & Data Flow**: [tRPC v11](https://trpc.io/) for end-to-end type safety, [TanStack Query v5](https://tanstack.com/query)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite / PostgreSQL
- **Authentication**: [NextAuth.js / Auth.js](https://authjs.dev/) with Prisma Adapter
- **Validation**: [Zod](https://zod.dev/) for contract schemas, environment variables, and tRPC inputs
- **e-Signatures**: [DocuSeal API](https://www.docuseal.com/)

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Database
DATABASE_URL="file:./db.sqlite"

# Authentication (NextAuth / Auth.js)
AUTH_SECRET="your-32-character-random-secret"
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

# DocuSeal E-Signature Integration
DOCUSEAL_API_URL="https://lg.jcodea.com"
DOCUSEAL_API_KEY="your-docuseal-api-key"
DOCUSEAL_TEMPLATE_ID="3"                 # Default Template ID (Optional, can be overridden per contract in UI)
DOCUSEAL_WEBHOOK_SECRET="your-webhook-secret" # Secret configured in DocuSeal Webhook settings
```

---

## 🚦 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd saas-billing-managers
npm install
```

### 2. Prepare Database
```bash
# Push Prisma schema to the database
npm run db:push

# Generate Prisma Client
npm run postinstall
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Verify Type Safety
```bash
npm run typecheck
```

---

## 📡 DocuSeal Webhook Setup

To automatically activate contracts when both parties finish signing:
1. Open your DocuSeal dashboard (e.g. `https://lg.jcodea.com`).
2. Go to **Settings** > **Webhooks**.
3. Add a new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/docuseal` (or your ngrok URL during local testing)
   - **Events**: Select `submission.completed`
   - **Secret**: Generate a secret and paste it into `DOCUSEAL_WEBHOOK_SECRET` in `.env`.
4. When a submission completes, DocuSeal notifies the CSOC backend, transitions the contract to `ACTIVE`, and records an audit log.

---

## 📂 Project Structure

```
src/
├── app/                         # Next.js App Router
│   ├── api/
│   │   ├── auth/                # Auth.js handler
│   │   ├── license/verify/      # Public edge license verification endpoint
│   │   ├── pdf/                 # Invoice PDF generation endpoint
│   │   └── webhooks/docuseal/   # Secure DocuSeal webhook handler
│   ├── dashboard/               # Operational command center pages
│   │   ├── contracts/           # Contracts & e-sign dispatch modal
│   │   ├── customers/           # Client 360 profiles & timeline
│   │   ├── invoices/            # Financial billing ledger
│   │   └── licenses/            # Telemetry & key management
├── features/                    # Feature-Driven Domain Isolation (FDDI)
│   ├── contracts/               # Contract schemas, tRPC routers, DocuSeal service
│   ├── customers/               # Customer directory & profile management
│   ├── invoices/                # Invoicing procedures & calculation logic
│   └── licenses/                # License generation & verification logic
├── server/                      # Core server layer
│   ├── api/root.ts              # tRPC root router
│   ├── auth.ts                  # Auth configuration
│   └── db.ts                    # Prisma client singleton
└── styles/                      # Tailwind v4 CSS entry point
```

---

## 📜 License & Compliance
This software is intended for SaaS operations and client management. All destructive operator actions are logged to the immutable `AuditLog` table for auditing and compliance.
