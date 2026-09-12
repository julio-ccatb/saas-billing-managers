import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { companyProfileSchema } from "~/lib/schemas/invoice";

export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const profile = await ctx.db.companyProfile.findUnique({
      where: { userId },
    });

    if (profile) return profile;

    // Return sensible defaults pre-populated from User if available
    return {
      id: "",
      userId,
      companyName: ctx.session.user.name ?? "",
      email: ctx.session.user.email ?? "",
      phone: "",
      address: "",
      city: "",
      zipCode: "",
      country: "",
      taxId: "",
      logoUrl: null,
      signatureData: null,
      currency: "USD",
      paymentTerms: "Payment due upon receipt",
      notes: "Thank you for your business!",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),

  upsert: protectedProcedure
    .input(companyProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      return ctx.db.companyProfile.upsert({
        where: { userId },
        create: {
          ...input,
          userId,
        },
        update: input,
      });
    }),
});
