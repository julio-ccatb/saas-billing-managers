import { invoiceRouter } from "~/features/billing/server/router";
import { customerRouter } from "~/features/clients/server/router";
import { licenseRouter } from "~/features/licenses/server/router";
import { contractRouter } from "~/features/contracts/server/router";
import { auditRouter } from "~/features/audit/server/router";
import { profileRouter } from "~/server/api/routers/profile";
import { companyRouter } from "~/server/api/routers/company";
import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  company: companyRouter,
  invoice: invoiceRouter,
  customer: customerRouter,
  profile: profileRouter,
  post: postRouter,
  license: licenseRouter,
  contract: contractRouter,
  audit: auditRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
