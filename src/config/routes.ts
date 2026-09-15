/**
 * Application Routes Registry (Master Source of Truth)
 * Use these constants and builder functions instead of hardcoding route paths.
 */
export const AppRoutes = {
  // Public / Auth
  HOME: "/",
  SIGN_IN: "/auth/signin",

  // Core Operations & Command Center
  DASHBOARD: "/dashboard",
  AUDIT: "/dashboard/audit",
  SETTINGS: "/dashboard/settings",

  // Customers / Clients
  CUSTOMERS: "/dashboard/customers",
  CUSTOMER_NEW: "/dashboard/customers/new",
  CUSTOMER_DETAILS: (id: string) => `/dashboard/customers/${id}`,

  // Invoices & Billing
  INVOICES: "/dashboard/invoices",
  INVOICE_DETAILS: (id: string) => `/dashboard/invoices/${id}`,
  INVOICE_NEW: (customerId?: string) =>
    customerId
      ? `/dashboard/invoices/new?customerId=${encodeURIComponent(customerId)}`
      : "/dashboard/invoices/new",
  INVOICE_EDIT: (id: string) => `/dashboard/invoices/${id}/edit`,

  // Contracts
  CONTRACTS: "/dashboard/contracts",

  // Licenses & Services
  LICENSES: "/dashboard/licenses",

  // API Endpoints
  API: {
    EXPORT_PDF: "/api/invoice/export-pdf",
    VERIFY_LICENSE: "/api/v1/licenses/verify",
    DOCUSEAL_WEBHOOK: "/api/webhooks/docuseal",
    TRPC: "/api/trpc",
  },
} as const;

export type AppRouteMap = typeof AppRoutes;
