import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = vi.hoisted(() => ({
  customer: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  invoice: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  license: {
    findMany: vi.fn(),
  },
  contract: {
    findMany: vi.fn(),
  },
  companyMember: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock("~/server/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "client-user-1",
      email: "client@techcorp.com",
      name: "TechCorp Client",
      role: "CLIENT",
      customerId: "cust-1",
    },
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() },
}));

vi.mock("~/server/db", () => ({
  db: mockDb,
}));

vi.mock("~/features/audit/server/auditService", () => ({
  recordAuditLog: vi.fn().mockResolvedValue({ id: "audit-1" }),
}));

import { portalRouter } from "./router";

describe("portalRouter Invoice Query Procedures", () => {
  const customer = {
    id: "cust-1",
    companyId: "company-1",
    name: "TechCorp Inc",
    email: "billing@techcorp.com",
    clientUserId: "client-user-1",
    company: {
      id: "company-1",
      name: "SaaS Ops Provider",
      currency: "USD",
    },
  };

  const sampleInvoice = {
    id: "inv-101",
    companyId: "company-1",
    customerId: "cust-1",
    userId: "operator-1",
    invoiceNumber: "INV-2026-0001",
    receiverEmail: "billing@techcorp.com",
    receiverName: "TechCorp Inc",
    totalAmount: 1500,
    currency: "USD",
    status: "PENDING",
    issueDate: new Date(),
    dueDate: new Date(),
    items: [],
    receipts: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.customer.findFirst.mockResolvedValue(customer);
    mockDb.customer.findMany.mockResolvedValue([customer]);
    mockDb.customer.findUnique.mockResolvedValue(customer);
    mockDb.companyMember.findUnique.mockResolvedValue(null);
  });

  it("should return invoices matching either customerId or receiverEmail in getInvoices", async () => {
    mockDb.invoice.findMany.mockResolvedValue([sampleInvoice]);

    const caller = portalRouter.createCaller({
      session: {
        user: {
          id: "client-user-1",
          email: "client@techcorp.com",
          role: "CLIENT",
          customerId: "cust-1",
        },
        expires: "2099-01-01",
      },
      headers: new Headers(),
      db: mockDb as any,
    });

    const result = await caller.getInvoices({ status: "ALL" });
    expect(result).toHaveLength(1);
    expect(result[0]?.invoiceNumber).toBe("INV-2026-0001");
    expect(mockDb.invoice.findMany).toHaveBeenCalled();
  });

  it("should return invoice by ID when client is authorized in getInvoiceById", async () => {
    mockDb.invoice.findUnique.mockResolvedValue({
      ...sampleInvoice,
      company: customer.company,
    });

    const caller = portalRouter.createCaller({
      session: {
        user: {
          id: "client-user-1",
          email: "client@techcorp.com",
          role: "CLIENT",
          customerId: "cust-1",
        },
        expires: "2099-01-01",
      },
      headers: new Headers(),
      db: mockDb as any,
    });

    const result = await caller.getInvoiceById({ id: "inv-101" });
    expect(result.id).toBe("inv-101");
    expect(result.invoiceNumber).toBe("INV-2026-0001");
  });

  it("should throw NOT_FOUND if invoice belongs to an unrelated customer", async () => {
    mockDb.customer.findUnique.mockImplementation(async ({ where }: any) => {
      if (where?.id === "other-customer") {
        return {
          id: "other-customer",
          clientUserId: "someone-else",
          email: "other@rival.com",
        };
      }
      return customer;
    });

    mockDb.customer.findMany.mockResolvedValue([
      { id: "cust-1", email: "billing@techcorp.com" },
    ]);

    mockDb.invoice.findUnique.mockResolvedValue({
      id: "inv-999",
      companyId: "other-company",
      customerId: "other-customer",
      userId: "other-operator",
      invoiceNumber: "INV-OTHER-999",
      receiverEmail: "other@rival.com",
      company: { id: "other-company" },
      items: [],
      receipts: [],
    });

    const caller = portalRouter.createCaller({
      session: {
        user: {
          id: "client-user-1",
          email: "client@techcorp.com",
          role: "CLIENT",
          customerId: "cust-1",
        },
        expires: "2099-01-01",
      },
      headers: new Headers(),
      db: mockDb as any,
    });

    await expect(caller.getInvoiceById({ id: "inv-999" })).rejects.toThrow(
      "Invoice not found or access denied."
    );
  });
});
