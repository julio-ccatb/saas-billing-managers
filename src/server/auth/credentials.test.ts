import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const mockDb = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  company: {
    create: vi.fn(),
  },
}));

vi.mock("~/server/db", () => ({
  db: mockDb,
}));


import { authorizeCredentials } from "./authorize";

describe("authorizeCredentials Guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should authorize demo operator workspace without password", async () => {
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "demo-user-id",
      email: "demo@invoify.com",
      name: "Alex Morgan",
      userRole: "OPERATOR",
      image: "avatar.png",
      clientProfile: null,
    });

    const user = await authorizeCredentials({
      email: "demo@invoify.com",
      isDemo: "true",
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("demo@invoify.com");
    expect(user?.role).toBe("OPERATOR");
  });

  it("should authorize a client with valid email, password, and CLIENT role", async () => {
    const rawPassword = "ValidPassword123!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "client-user-1",
      email: "client@company.com",
      name: "Acme Client",
      passwordHash,
      userRole: "CLIENT",
      image: "avatar.png",
      clientProfile: { id: "cust-1" },
    });

    const user = await authorizeCredentials({
      email: "client@company.com",
      password: rawPassword,
    });

    expect(user).not.toBeNull();
    expect(user?.id).toBe("client-user-1");
    expect(user?.role).toBe("CLIENT");
    expect(user?.customerId).toBe("cust-1");
  });

  it("should reject client authorization when password is wrong", async () => {
    const correctPassword = "CorrectPassword123!";
    const passwordHash = await bcrypt.hash(correctPassword, 10);

    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "client-user-1",
      email: "client@company.com",
      name: "Acme Client",
      passwordHash,
      userRole: "CLIENT",
      image: "avatar.png",
      clientProfile: { id: "cust-1" },
    });

    const user = await authorizeCredentials({
      email: "client@company.com",
      password: "WrongPassword!",
    });

    expect(user).toBeNull();
  });

  it("should reject operator accounts trying to authenticate through credentials", async () => {
    const rawPassword = "OperatorPassword123!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Operator user without a client profile
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "operator-user-1",
      email: "admin@agency.com",
      name: "Admin User",
      passwordHash,
      userRole: "OPERATOR",
      image: "avatar.png",
      clientProfile: null,
    });

    const user = await authorizeCredentials({
      email: "admin@agency.com",
      password: rawPassword,
    });

    expect(user).toBeNull();
  });

  it("should reject when email or password is missing", async () => {
    const result1 = await authorizeCredentials({
      email: "",
      password: "password123",
    });
    expect(result1).toBeNull();

    const result2 = await authorizeCredentials({
      email: "client@company.com",
      password: "",
    });
    expect(result2).toBeNull();
  });
});

