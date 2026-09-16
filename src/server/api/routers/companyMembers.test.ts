import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB
const mockDb = vi.hoisted(() => ({
  companyMember: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

vi.mock("~/server/db", () => ({
  db: mockDb,
}));

vi.mock("~/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("~/features/audit/server/auditService", () => ({
  recordAuditLog: vi.fn().mockResolvedValue({ id: "audit-log-1" }),
}));

import { companyRouter } from "./company";

describe("companyRouter Member Management Procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createOwnerCaller = () =>
    companyRouter.createCaller({
      db: mockDb as any,
      session: {
        user: { id: "owner-user-id", email: "owner@company.com", role: "OPERATOR" },
        expires: "2099-01-01",
      },
      headers: new Headers({ "x-company-id": "company-1" }),
    });

  const createAdminCaller = () =>
    companyRouter.createCaller({
      db: mockDb as any,
      session: {
        user: { id: "admin-user-id", email: "admin@company.com", role: "OPERATOR" },
        expires: "2099-01-01",
      },
      headers: new Headers({ "x-company-id": "company-1" }),
    });

  const createMemberCaller = () =>
    companyRouter.createCaller({
      db: mockDb as any,
      session: {
        user: { id: "member-user-id", email: "member@company.com", role: "OPERATOR" },
        expires: "2099-01-01",
      },
      headers: new Headers({ "x-company-id": "company-1" }),
    });

  describe("getMembers", () => {
    it("should return the list of company members with user profiles", async () => {
      mockDb.companyMember.findUnique.mockResolvedValueOnce({
        id: "mem-owner",
        companyId: "company-1",
        userId: "owner-user-id",
        role: "OWNER",
        company: { id: "company-1", name: "Acme Corp" },
      });

      mockDb.companyMember.findMany.mockResolvedValueOnce([
        {
          id: "mem-1",
          userId: "user-1",
          role: "OWNER",
          createdAt: new Date(),
          user: {
            id: "user-1",
            name: "Alice Owner",
            email: "alice@acme.com",
            image: "avatar1.png",
          },
        },
        {
          id: "mem-2",
          userId: "user-2",
          role: "MEMBER",
          createdAt: new Date(),
          user: {
            id: "user-2",
            name: "Bob Operator",
            email: "bob@acme.com",
            image: "avatar2.png",
          },
        },
      ]);

      const caller = createOwnerCaller();
      const members = await caller.getMembers();

      expect(members).toHaveLength(2);
      expect(members[0]?.user.name).toBe("Alice Owner");
      expect(members[0]?.role).toBe("OWNER");
      expect(members[1]?.user.name).toBe("Bob Operator");
      expect(members[1]?.role).toBe("MEMBER");
    });
  });

  describe("addMember", () => {
    it("should allow OWNER or ADMIN to add a new team member", async () => {
      mockDb.companyMember.findUnique
        // 1. Procedure middleware lookup
        .mockResolvedValueOnce({
          id: "mem-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // 2. Existing membership check
        .mockResolvedValueOnce(null);

      mockDb.user.findUnique.mockResolvedValueOnce({
        id: "user-new",
        email: "newmember@acme.com",
        name: "New Member",
      });

      mockDb.companyMember.create.mockResolvedValueOnce({
        id: "mem-new-1",
        companyId: "company-1",
        userId: "user-new",
        role: "MEMBER",
        createdAt: new Date(),
        user: {
          id: "user-new",
          name: "New Member",
          email: "newmember@acme.com",
          image: null,
        },
      });

      const caller = createOwnerCaller();
      const res = await caller.addMember({
        email: "newmember@acme.com",
        role: "MEMBER",
      });

      expect(res.id).toBe("mem-new-1");
      expect(res.role).toBe("MEMBER");
      expect(mockDb.companyMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: "company-1",
            userId: "user-new",
            role: "MEMBER",
          }),
        })
      );
    });

    it("should reject adding a member if caller role is MEMBER", async () => {
      mockDb.companyMember.findUnique.mockResolvedValueOnce({
        id: "mem-regular",
        companyId: "company-1",
        userId: "member-user-id",
        role: "MEMBER",
        company: { id: "company-1", name: "Acme Corp" },
      });

      const caller = createMemberCaller();

      await expect(
        caller.addMember({
          email: "someone@acme.com",
          role: "MEMBER",
        })
      ).rejects.toThrow("Only workspace owners or administrators can add team members.");
    });

    it("should reject if user is already a member", async () => {
      mockDb.companyMember.findUnique
        // Middleware
        .mockResolvedValueOnce({
          id: "mem-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // Existing membership check -> returns existing
        .mockResolvedValueOnce({
          id: "already-member",
          companyId: "company-1",
          userId: "user-existing",
        });

      mockDb.user.findUnique.mockResolvedValueOnce({
        id: "user-existing",
        email: "existing@acme.com",
      });

      const caller = createOwnerCaller();

      await expect(
        caller.addMember({
          email: "existing@acme.com",
          role: "MEMBER",
        })
      ).rejects.toThrow("already a member");
    });
  });

  describe("updateMemberRole", () => {
    it("should allow OWNER to update roles", async () => {
      mockDb.companyMember.findUnique
        // Middleware
        .mockResolvedValueOnce({
          id: "mem-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // Target member lookup
        .mockResolvedValueOnce({
          id: "target-mem",
          companyId: "company-1",
          userId: "user-target",
          role: "MEMBER",
          user: { email: "target@acme.com" },
        });

      mockDb.companyMember.update.mockResolvedValueOnce({
        id: "target-mem",
        role: "ADMIN",
        user: { email: "target@acme.com" },
      });

      const caller = createOwnerCaller();
      const updated = await caller.updateMemberRole({
        memberId: "target-mem",
        role: "ADMIN",
      });

      expect(updated.role).toBe("ADMIN");
    });

    it("should block demoting the sole owner of a company", async () => {
      mockDb.companyMember.findUnique
        // Middleware
        .mockResolvedValueOnce({
          id: "mem-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // Target member is an OWNER
        .mockResolvedValueOnce({
          id: "target-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          user: { email: "owner@acme.com" },
        });

      // Count owners -> only 1
      mockDb.companyMember.count.mockResolvedValueOnce(1);

      const caller = createOwnerCaller();

      await expect(
        caller.updateMemberRole({
          memberId: "target-owner",
          role: "ADMIN",
        })
      ).rejects.toThrow("Cannot demote the sole owner");
    });

    it("should prevent ADMIN from promoting someone to OWNER", async () => {
      mockDb.companyMember.findUnique
        // Middleware
        .mockResolvedValueOnce({
          id: "mem-admin",
          companyId: "company-1",
          userId: "admin-user-id",
          role: "ADMIN",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // Target member
        .mockResolvedValueOnce({
          id: "target-mem",
          companyId: "company-1",
          userId: "user-target",
          role: "MEMBER",
          user: { email: "target@acme.com" },
        });

      const caller = createAdminCaller();

      await expect(
        caller.updateMemberRole({
          memberId: "target-mem",
          role: "OWNER",
        })
      ).rejects.toThrow("Only workspace owners can grant or modify owner roles.");
    });
  });

  describe("removeMember", () => {
    it("should prevent removing the sole owner of a workspace", async () => {
      mockDb.companyMember.findUnique
        // Middleware
        .mockResolvedValueOnce({
          id: "mem-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // Target is an OWNER
        .mockResolvedValueOnce({
          id: "target-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          user: { email: "owner@acme.com" },
        });

      mockDb.companyMember.count.mockResolvedValueOnce(1);

      const caller = createOwnerCaller();

      await expect(
        caller.removeMember({ memberId: "target-owner" })
      ).rejects.toThrow("Cannot remove the sole owner");
    });

    it("should allow OWNER to remove a member", async () => {
      mockDb.companyMember.findUnique
        // Middleware
        .mockResolvedValueOnce({
          id: "mem-owner",
          companyId: "company-1",
          userId: "owner-user-id",
          role: "OWNER",
          company: { id: "company-1", name: "Acme Corp" },
        })
        // Target is a regular MEMBER
        .mockResolvedValueOnce({
          id: "target-mem",
          companyId: "company-1",
          userId: "user-target",
          role: "MEMBER",
          user: { email: "target@acme.com" },
        });

      mockDb.companyMember.delete.mockResolvedValueOnce({
        id: "target-mem",
      });

      const caller = createOwnerCaller();
      const res = await caller.removeMember({ memberId: "target-mem" });

      expect(res.id).toBe("target-mem");
      expect(mockDb.companyMember.delete).toHaveBeenCalledWith({
        where: { id: "target-mem" },
      });
    });
  });
});
