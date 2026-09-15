import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, companyProcedure } from "~/server/api/trpc";
import { customerSchema } from "~/lib/schemas/invoice";
import { clientOnboardingSchema } from "../schemas/onboarding.schema";
import { generateLicenseKey } from "~/features/licenses/server/keygen";
import { recordAuditLog } from "~/features/audit/server/auditService";
import bcrypt from "bcryptjs";

export const customerRouter = createTRPCRouter({
  getAll: companyProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const search = input?.search?.trim();

      const where: any = { companyId };
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
        ];
      }

      return ctx.db.customer.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          clientUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              invoices: true,
              contracts: true,
              licenses: true,
            },
          },
        },
      });
    }),

  getById: companyProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const customer = await ctx.db.customer.findUnique({
        where: { id: input.id },
        include: {
          clientUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          contracts: {
            orderBy: { createdAt: "desc" },
          },
          licenses: {
            orderBy: { createdAt: "desc" },
          },
          invoices: {
            orderBy: { issueDate: "desc" },
            include: {
              receipts: {
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      });

      if (!customer || customer.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      return customer;
    }),

  upsert: companyProcedure
    .input(customerSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      if (id) {
        const existing = await ctx.db.customer.findUnique({ where: { id } });
        if (!existing || existing.companyId !== companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }
        return ctx.db.customer.update({
          where: { id },
          data,
        });
      }

      return ctx.db.customer.create({
        data: {
          ...data,
          companyId,
          userId,
        },
      });
    }),

  delete: companyProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.customer.findUnique({ where: { id: input.id } });
      if (!existing || existing.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      const deleted = await ctx.db.customer.delete({
        where: { id: input.id },
      });

      await recordAuditLog(ctx.db, {
        companyId: ctx.companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "CUSTOMER_DELETED",
        entityType: "CUSTOMER",
        entityId: existing.id,
        reason: input.reason?.trim() || "Customer removed by operator",
        metadata: {
          customerName: existing.name,
          email: existing.email,
        },
      });

      return deleted;
    }),

  /**
   * Unified, atomic Client Onboarding Procedure.
   * Creates Customer + Contract + License + Initial Invoice in a single transaction.
   */
  onboardClient: companyProcedure
    .input(clientOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.companyId;
      const userId = ctx.session.user.id;
      const company = ctx.company;
      const { profile, contract: contractInput, license: licenseInput, invoice: invoiceInput } = input;

      return ctx.db.$transaction(async (tx) => {
        // 1. Create the Customer
        const customer = await tx.customer.create({
          data: {
            companyId,
            userId,
            name: profile.name.trim(),
            email: profile.email.trim(),
            phone: profile.phone.trim(),
            address: profile.address.trim(),
            city: profile.city.trim(),
            zipCode: profile.zipCode.trim(),
            country: profile.country.trim(),
            taxId: profile.taxId.trim(),
          },
        });

        // 2. Create Contract (if enabled)
        let contract = null;
        if (contractInput.enabled) {
          const contractNumber = `CTR-${Date.now().toString().slice(-6)}`;
          const isDirectActive = contractInput.status === "ACTIVE";
          contract = await tx.contract.create({
            data: {
              companyId,
              userId,
              customerId: customer.id,
              contractNumber,
              title: contractInput.title.trim() || "SaaS Platform Subscription",
              value: contractInput.value,
              currency: contractInput.currency,
              billingCycle: contractInput.billingCycle,
              startDate: contractInput.startDate,
              signedAt: isDirectActive ? new Date() : null,
              status: isDirectActive ? "ACTIVE" : "DRAFT",
              terms: contractInput.terms.trim(),
            },
          });
        }

        // 3. Provision Software License (if enabled)
        let license = null;
        if (licenseInput.enabled) {
          const key = generateLicenseKey();
          license = await tx.license.create({
            data: {
              companyId,
              userId,
              customerId: customer.id,
              name: licenseInput.name.trim() || "Production API License",
              key,
              allowedDomain: licenseInput.allowedDomain?.trim() || null,
              leaseTtlMinutes: licenseInput.leaseTtlMinutes,
              gracePeriodHours: licenseInput.gracePeriodHours,
              suspensionNotice: licenseInput.suspensionNotice?.trim() || null,
              status: "ACTIVE",
            },
          });
        }

        // 4. Create Initial Invoice (if enabled)
        let invoice = null;
        if (invoiceInput.enabled && invoiceInput.amount > 0) {
          const count = await tx.invoice.count({ where: { companyId } });
          const year = new Date().getFullYear();
          const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, "0")}`;

          invoice = await tx.invoice.create({
            data: {
              companyId,
              userId,
              customerId: customer.id,
              invoiceNumber,
              issueDate: new Date(),
              dueDate: invoiceInput.dueDate,
              status: "PENDING",
              currency: contractInput?.currency || company.currency || "USD",

              // Sender details from active company
              senderName: company.name || "Billing Admin",
              senderEmail: company.email || "",
              senderPhone: company.phone || "",
              senderAddress: company.address || "",
              senderCity: company.city || "",
              senderZipCode: company.zipCode || "",
              senderCountry: company.country || "",
              senderTaxId: company.taxId || "",

              // Receiver details
              receiverName: customer.name,
              receiverEmail: customer.email,
              receiverPhone: customer.phone,
              receiverAddress: customer.address,
              receiverCity: customer.city,
              receiverZipCode: customer.zipCode,
              receiverCountry: customer.country,
              receiverTaxId: customer.taxId,

              subTotal: invoiceInput.amount,
              totalAmount: invoiceInput.amount,
              notes: invoiceInput.notes,

              items: {
                create: [
                  {
                    description: invoiceInput.description.trim() || "Initial Subscription & Setup",
                    quantity: 1,
                    unitPrice: invoiceInput.amount,
                    total: invoiceInput.amount,
                    orderIndex: 0,
                  },
                ],
              },
            },
          });
        }

        // 5. Write Immutable Audit Entry
        await tx.auditLog.create({
          data: {
            companyId,
            userId,
            operatorId: ctx.session.user.email ?? userId,
            action: "CLIENT_ONBOARDED",
            entityType: "CUSTOMER",
            entityId: customer.id,
            reason: `Full client onboarding completed (Contract: ${Boolean(contract)}, License: ${Boolean(license)}, Initial Invoice: ${Boolean(invoice)})`,
            metadata: JSON.stringify({
              customerName: customer.name,
              contractNumber: contract?.contractNumber ?? null,
              contractValue: contract?.value ?? null,
              licenseKey: license?.key ?? null,
              invoiceNumber: invoice?.invoiceNumber ?? null,
              invoiceAmount: invoice?.totalAmount ?? null,
            }),
          },
        });

        return {
          customerId: customer.id,
          customer,
          contract,
          license,
          invoice,
        };
      });
    }),

  /**
   * Enable, disable, or update Client Portal login credentials for a customer.
   */
  setPortalAccess: companyProcedure
    .input(
      z.object({
        customerId: z.string(),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
        portalEnabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const customer = await ctx.db.customer.findUnique({
        where: { id: input.customerId },
        include: { clientUser: true },
      });

      if (!customer || customer.companyId !== ctx.companyId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found or unauthorized.",
        });
      }

      const email = input.email.trim().toLowerCase();

      let clientUserId = customer.clientUserId;

      if (input.portalEnabled) {
        // If updating or creating password
        let passwordHash: string | undefined;
        if (input.password) {
          passwordHash = await bcrypt.hash(input.password, 10);
        }

        if (customer.clientUser) {
          // Update existing client user
          const updatedUser = await ctx.db.user.update({
            where: { id: customer.clientUser.id },
            data: {
              email,
              ...(passwordHash ? { passwordHash } : {}),
              userRole: "CLIENT",
            },
          });
          clientUserId = updatedUser.id;
        } else {
          // Check if user with this email already exists
          const existingUser = await ctx.db.user.findUnique({
            where: { email },
          });

          if (existingUser) {
            if (!passwordHash && !existingUser.passwordHash) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Password is required to set up portal access for this client.",
              });
            }
            const updatedUser = await ctx.db.user.update({
              where: { id: existingUser.id },
              data: {
                userRole: "CLIENT",
                ...(passwordHash ? { passwordHash } : {}),
              },
            });
            clientUserId = updatedUser.id;
          } else {
            if (!passwordHash) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Password is required to create new client credentials.",
              });
            }
            const newUser = await ctx.db.user.create({
              data: {
                email,
                name: customer.name,
                passwordHash,
                userRole: "CLIENT",
                image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customer.name)}`,
              },
            });
            clientUserId = newUser.id;
          }
        }
      }

      const updatedCustomer = await ctx.db.customer.update({
        where: { id: customer.id },
        data: {
          clientUserId,
          portalEnabled: input.portalEnabled,
          email,
        },
        include: {
          clientUser: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      await recordAuditLog(ctx.db, {
        companyId: ctx.companyId,
        userId: ctx.session.user.id,
        operatorId: ctx.session.user.email ?? ctx.session.user.id,
        action: "BILLING_OVERRIDE",
        entityType: "CUSTOMER",
        entityId: customer.id,
        reason: input.portalEnabled
          ? `Client Portal access enabled for ${customer.name} (${email})`
          : `Client Portal access revoked for ${customer.name}`,
        metadata: {
          customerId: customer.id,
          customerName: customer.name,
          portalEnabled: input.portalEnabled,
          clientEmail: email,
        },
      });

      return updatedCustomer;
    }),
});

