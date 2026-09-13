# 🧩 Agent Mandates - Client Software Operations Controller (CSOC)

This document defines the foundational mandates for AI coding agents within this project. These instructions take absolute precedence over general defaults.

## 1. Core Mandates & Skill Activation

- **Skill Activation First**: For any task involving UI components, client control panels, or payment/service workflows, you MUST prioritize activating the relevant skill:
  - `interface-design`: For admin dashboards, financial ledgers, and service toggle controls.
  - `shadcn-ui`: For accessible React components, data tables, and secure form layouts (Hook Form + Zod).
  - `frontend-design`: For dense, high-utility operational dashboards.
  - `vercel-react-best-practices`: For Next.js App Router, Server Actions, and Server Component optimization.
  - `find-skills`: To extend capabilities when a specialized tool is required.
- **English-Only Workflow**: All technical rationale, code comments, database enums, and UI labels must be in **English**.

## 2. Technical Standards & Data Truth

- **Prisma Schema as Source of Truth**: Before generating any tRPC endpoints, database queries, or UI state hooks, **you must read `prisma/schema.prisma`**. Ensure all types match database models directly.
- **T3 Stack Integrity**: Adhere strictly to the T3 App architecture (Next.js App Router, tRPC, Tailwind v4, Zod, NextAuth/Lucia).
- **Tailwind v4 & CSS-First**: Leverage Tailwind 4's CSS-first configuration and OKLCH color space. Avoid hardcoded tailwind v3 utility structures or deprecated color formats.
- **Audit Log Mandatory**: Every destructive action (e.g., disabling a client's service, revoking API keys, or overriding a billing status) **must write an immutable record** to the `AuditLog` table with the operator ID, timestamp, and rationale.

## 3. Visual Identity: "Operations & Billing Command Center"

Maintain a high-density, status-focused operational layout built for fast decision-making:

- **Shadcn/UI Variable Constraint**: **Mandatory use of CSS variables** (`bg-background`, `border-border`, `text-primary`, `bg-destructive`). Avoid hardcoded hex codes or static Tailwind colors (e.g., no `bg-black` or `text-red-500`).
- **Typography**: Bold `Space Grotesk` or `Inter` for headings, paired with `Geist Mono` or `JetBrains Mono` for monetary amounts, contract IDs, IP addresses, and service status badges.
- **Domain Logic Layout**:
  - **Hierarchy**: Client -> Contracts -> Subscriptions / Managed Apps -> Billing Ledger & Service Status -> Needs / Support Tickets.
  - **Bento Grid & Status Cards**: Display metrics (MRR, Overdue Invoices, Active Services) in high-density `rounded-xl` cards with subtle `border-border`.
  - **Status Indicators**: Clear visual distinctions using status badges:
    - **Active / Paid**: Subtle Green tint.
    - **Past Due / Warning**: Subtle Amber tint.
    - **Suspended / Unpaid**: High-contrast Destructive / Neutral muted state.

## 4. Key Functional Rules (Domain Logic)

- **Service Disablement Guardrails**: Any function or tRPC procedure responsible for disabling client services due to non-payment must:
  1. Verify active billing status and overdue threshold.
  2. Require explicit confirmation or automated trigger checks.
  3. Fire webhooks/API calls to revoke access safely without corrupting client data.
  4. Log the action in the audit history.
- **Contract & Needs Tracking**: Treat contracts as immutable once signed. Model client needs/requests as a structured timeline attached to the client profile with explicit priority flags.

## 5. Communication Style

- **Expert Peer Persona**: Operate as a senior full-stack engineer with deep expertise in SaaS multi-tenancy, fintech ledgers, and admin security.
- **Intent & Rationale**: Focus exclusively on technical intent and architectural correctness. Avoid conversational filler or apologies.
- **Verification**: Verify all code against project-specific build, type-check (`tsc`), and linting rules before presenting solutions.