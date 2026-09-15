# DocuSeal E-Signature & Webhook Integration Guide

This guide outlines how the DocuSeal integration operates across the entire contract lifecycle, both in local development (zero-tunnel) and in live production.

---

## 1. Environment Configuration

Ensure the following variables are configured in your `.env` file:

```env
# DocuSeal Server Endpoint
DOCUSEAL_API_URL=https://lg.jcodea.com

# API Key generated in your DocuSeal profile/settings
DOCUSEAL_API_KEY=your_docuseal_api_key_here

# Secret used to verify webhook signatures (Settings -> Webhooks in DocuSeal)
DOCUSEAL_WEBHOOK_SECRET=your_docuseal_webhook_secret_here

# (Optional) Pre-built DocuSeal template ID
# If omitted, our dynamic PDF contract generator will be used automatically
DOCUSEAL_TEMPLATE_ID=
```

---

## 2. End-to-End Contract Lifecycle

```
[Create Contract] 
       │ (Starts in DRAFT status)
       ▼
[Send e-Sign] ──► Dispatches agreement to DocuSeal ──► Generates interactive signing link
       │
       ├─────────────────────────────────────────┐
       ▼                                         ▼
[Zero-Tunnel Testing (Localhost)]       [Production Webhook]
  - Open & sign link in browser           - DocuSeal sends POST to /api/webhooks/docuseal
  - Click "Sync Status" on dashboard      - Verifies HMAC signature with DOCUSEAL_WEBHOOK_SECRET
  - Outbound GET to DocuSeal API          - Ingests submission.completed event
       │                                         │
       └────────────────────┬────────────────────┘
                            ▼
              [processContractCompletion]
                 1. Contract status ──► ACTIVE
                 2. Signed PDF URL archived
                 3. Initial Invoice generated in PENDING status
                 4. Immutable AuditLog written (CONTRACT_SIGNED)
```

---

## 3. Local Development: Testing Without ngrok

You do **not** need ngrok, localtunnel, or public ports to test the real DocuSeal signature flow:

1. **Create a Contract**: Click **"New Contract"** on the Contracts dashboard. Keep execution mode as `Draft`.
2. **Dispatch to DocuSeal**: Click **"Send e-Sign"**. You will receive an interactive signing link.
3. **Sign Agreement**: Click **"Open Client Signing View"** to sign the agreement in your browser.
4. **Synchronize**: Return to the dashboard and click the **"Sync Status"** button on the contract.
   - Your local server performs an outbound query to `GET /api/submissions/:id`.
   - Once it verifies the submission is completed, it activates the contract, stores the signed PDF link, creates the invoice, and writes the audit log.

---

## 4. Going Live: Configuring Webhooks in DocuSeal

When your application is deployed to production:

1. Log into your DocuSeal console (`https://lg.jcodea.com` or your instance).
2. Go to **Settings -> Webhooks** (or **API -> Webhooks**).
3. Click **Add Webhook**:
   - **Target URL**: `https://<your-production-domain>/api/webhooks/docuseal`
   - **Events**: Select `submission.completed` and `submission.declined`.
   - **Secret**: Copy the secret key provided by DocuSeal into `DOCUSEAL_WEBHOOK_SECRET` in your server `.env`.
4. Contracts will now automatically transition to `ACTIVE` and generate billing records in real-time as soon as the client finishes signing!
