import { describe, it, expect, vi, beforeEach } from "vitest";
import { canUserAccessInvoice, type InvoiceAccessSubject, type InvoiceAccessUser } from "./invoiceAccess";

describe("canUserAccessInvoice Access Control", () => {
  const invoice: InvoiceAccessSubject = {
    id: "inv-123",
    companyId: "company-alpha",
    customerId: "cust-456",
    receiverEmail: "billing@clientcorp.com",
    userId: "operator-creator-1",
  };

  const mockDb = {
    companyMember: {
      findUnique: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.customer.findMany.mockResolvedValue([]);
    mockDb.customer.findUnique.mockResolvedValue(null);
    mockDb.companyMember.findUnique.mockResolvedValue(null);
    mockDb.user.findUnique.mockResolvedValue(null);
  });

  it("should deny access if user ID is missing or empty", async () => {
    const result = await canUserAccessInvoice(mockDb, invoice, { id: "" });
    expect(result).toBe(false);
  });

  it("should allow access if user is the direct creator of the invoice", async () => {
    const user: InvoiceAccessUser = { id: "operator-creator-1" };
    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
    expect(mockDb.companyMember.findUnique).not.toHaveBeenCalled();
  });

  it("should allow access if user is another member/admin of the company", async () => {
    const user: InvoiceAccessUser = { id: "operator-admin-2", email: "admin@alphacorp.com" };
    mockDb.companyMember.findUnique.mockResolvedValue({ id: "member-1", role: "ADMIN" });

    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
    expect(mockDb.companyMember.findUnique).toHaveBeenCalledWith({
      where: {
        companyId_userId: {
          companyId: "company-alpha",
          userId: "operator-admin-2",
        },
      },
      select: { id: true, role: true },
    });
  });

  it("should allow access if user is the customer linked via customerId in session", async () => {
    const user: InvoiceAccessUser = { id: "client-user-1", customerId: "cust-456" };

    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
  });

  it("should allow access if customer is found in linked customers list", async () => {
    const user: InvoiceAccessUser = { id: "client-user-1", email: "client@clientcorp.com" };
    mockDb.customer.findMany.mockResolvedValue([
      { id: "cust-456", email: "client@clientcorp.com" },
    ]);

    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
  });

  it("should allow access if customer matches customer.clientUserId in DB", async () => {
    const user: InvoiceAccessUser = { id: "client-user-1" };
    mockDb.customer.findUnique.mockResolvedValue({
      id: "cust-456",
      clientUserId: "client-user-1",
      email: "other@clientcorp.com",
    });

    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
  });

  it("should allow access if user email matches customer email in DB (case-insensitive)", async () => {
    const user: InvoiceAccessUser = { id: "client-user-random", email: "Billing@ClientCorp.com" };
    mockDb.customer.findUnique.mockResolvedValue({
      id: "cust-456",
      clientUserId: null,
      email: "billing@clientcorp.com",
    });

    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
  });

  it("should allow access if user email matches invoice receiverEmail directly", async () => {
    const user: InvoiceAccessUser = { id: "client-user-random", email: "billing@clientcorp.com" };

    const result = await canUserAccessInvoice(mockDb, invoice, user);
    expect(result).toBe(true);
  });

  it("should allow access when invoice customerId is null but receiverEmail matches user email fetched from DB", async () => {
    const invoiceWithoutCustomerId: InvoiceAccessSubject = {
      ...invoice,
      customerId: null,
    };
    const user: InvoiceAccessUser = { id: "client-user-no-session-email" };
    mockDb.user.findUnique.mockResolvedValue({ email: "billing@clientcorp.com" });

    const result = await canUserAccessInvoice(mockDb, invoiceWithoutCustomerId, user);
    expect(result).toBe(true);
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { id: "client-user-no-session-email" },
      select: { email: true },
    });
  });

  it("should strictly deny access if user belongs to another company and is not the customer", async () => {
    const rogueUser: InvoiceAccessUser = { id: "stranger-user", email: "hacker@evil.com" };
    mockDb.customer.findUnique.mockResolvedValue({
      id: "cust-456",
      clientUserId: "client-user-1",
      email: "billing@clientcorp.com",
    });

    const result = await canUserAccessInvoice(mockDb, invoice, rogueUser);
    expect(result).toBe(false);
  });

  it("should strictly deny access if user is another client from a different customer account", async () => {
    const otherClientUser: InvoiceAccessUser = {
      id: "client-user-2",
      customerId: "cust-999",
      email: "bob@otherclient.com",
    };
    mockDb.customer.findMany.mockResolvedValue([
      { id: "cust-999", email: "bob@otherclient.com" },
    ]);
    mockDb.customer.findUnique.mockResolvedValue({
      id: "cust-456",
      clientUserId: "client-user-1",
      email: "billing@clientcorp.com",
    });

    const result = await canUserAccessInvoice(mockDb, invoice, otherClientUser);
    expect(result).toBe(false);
  });
});
