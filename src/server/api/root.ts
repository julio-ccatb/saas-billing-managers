import { invoiceRouter } from "~/server/api/routers/invoice";
import { customerRouter } from "~/server/api/routers/customer";
import { profileRouter } from "~/server/api/routers/profile";
import { postRouter } from "~/server/api/routers/post";
import { licenseRouter } from "~/server/api/routers/license";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  invoice: invoiceRouter,
  customer: customerRouter,
  profile: profileRouter,
  post: postRouter,
  license: licenseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 */
export const createCaller = createCallerFactory(appRouter);
