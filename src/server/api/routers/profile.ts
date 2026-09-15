import { createTRPCRouter, companyProcedure } from "~/server/api/trpc";
import { companyProfileSchema } from "~/lib/schemas/invoice";

export const profileRouter = createTRPCRouter({
  get: companyProcedure.query(async ({ ctx }) => {
    const company = ctx.company;

    return {
      id: company.id,
      userId: ctx.session.user.id,
      companyName: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      zipCode: company.zipCode,
      country: company.country,
      taxId: company.taxId,
      bankName: company.bankName,
      bankAccountName: company.bankAccountName,
      bankAccountNumber: company.bankAccountNumber,
      logoUrl: company.logoUrl,
      signatureData: company.signatureData,
      currency: company.currency,
      paymentTerms: company.paymentTerms,
      notes: company.notes,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }),

  upsert: companyProcedure
    .input(companyProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;

      return ctx.db.company.update({
        where: { id: companyId },
        data: {
          name: input.companyName?.trim() || ctx.company.name,
          email: input.email?.trim() ?? "",
          phone: input.phone?.trim() ?? "",
          address: input.address?.trim() ?? "",
          city: input.city?.trim() ?? "",
          zipCode: input.zipCode?.trim() ?? "",
          country: input.country?.trim() ?? "",
          taxId: input.taxId?.trim() ?? "",
          bankName: input.bankName?.trim() ?? "",
          bankAccountName: input.bankAccountName?.trim() ?? "",
          bankAccountNumber: input.bankAccountNumber?.trim() ?? "",
          logoUrl: input.logoUrl ?? null,
          signatureData: input.signatureData ?? null,
          currency: input.currency || "USD",
          paymentTerms: input.paymentTerms || "Payment due upon receipt",
          notes: input.notes || "Thank you for your business!",
        },
      });
    }),
});

