import { z } from "zod";
import { createTRPCRouter, companyProcedure } from "~/server/api/trpc";

export const auditRouter = createTRPCRouter({
  getAll: companyProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(25),
          action: z.string().optional(),
          entityType: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 25;
      const skip = (page - 1) * pageSize;
      const action = input?.action?.trim();
      const entityType = input?.entityType?.trim();
      const search = input?.search?.trim();

      const where: any = { companyId };
      if (action && action !== "ALL") {
        where.action = action;
      }
      if (entityType && entityType !== "ALL") {
        where.entityType = entityType;
      }
      if (search) {
        where.OR = [
          { reason: { contains: search } },
          { operatorId: { contains: search } },
          { entityId: { contains: search } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        ctx.db.auditLog.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  getRecent: companyProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(20).default(5),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const limit = input?.limit ?? 5;

      return ctx.db.auditLog.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }),
});
