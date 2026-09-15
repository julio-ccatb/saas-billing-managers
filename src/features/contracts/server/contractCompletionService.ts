import type { PrismaClient } from "generated/prisma";

export interface CompleteContractParams {
  contractIdentifier: string; // id or contractNumber
  submissionId?: number;
  completedAt?: Date;
  documents?: Array<{ name: string; url: string }>;
  submitters?: any[];
  operatorId: string;
  createInitialInvoice?: boolean;
}

export interface ContractCompletionResult {
  contract: any;
  idempotentSkip: boolean;
  generatedInvoiceId?: string;
  signedDocumentUrl?: string;
}

/**
 * Shared, idempotent contract completion service used by both DocuSeal webhooks
 * and manual/active DocuSeal status synchronization procedures.
 */
export async function processContractCompletion(
  db: PrismaClient,
  params: CompleteContractParams
): Promise<ContractCompletionResult> {
  const {
    contractIdentifier,
    submissionId,
    completedAt = new Date(),
    documents = [],
    submitters = [],
    operatorId,
    createInitialInvoice = true,
  } = params;

  return db.$transaction(async (tx) => {
    // 1. Fetch contract with customer relation
    const contract = await tx.contract.findFirst({
      where: {
        OR: [
          { id: contractIdentifier },
          { contractNumber: contractIdentifier },
        ],
      },
      include: {
        customer: true,
      },
    });

    if (!contract) {
      throw new Error(`Contract not found for identifier: ${contractIdentifier}`);
    }

    // Resolve final document URL
    const signedDocumentUrl =
      documents[0]?.url ?? contract.signedDocumentUrl ?? null;

    // Idempotency: If already ACTIVE and signedAt is set, update any missing documentUrl / submissionId
    if (contract.status === "ACTIVE" && contract.signedAt !== null) {
      if ((signedDocumentUrl && !contract.signedDocumentUrl) || (submissionId && !contract.submissionId)) {
        const updated = await tx.contract.update({
          where: { id: contract.id },
          data: {
            signedDocumentUrl: signedDocumentUrl ?? contract.signedDocumentUrl,
            submissionId: submissionId ?? contract.submissionId,
          },
        });
        return {
          contract: updated,
          idempotentSkip: true,
          signedDocumentUrl: signedDocumentUrl ?? undefined,
        };
      }
      return {
        contract,
        idempotentSkip: true,
        signedDocumentUrl: contract.signedDocumentUrl ?? undefined,
      };
    }

    // 2. Mark contract ACTIVE and record execution metadata
    const updatedContract = await tx.contract.update({
      where: { id: contract.id },
      data: {
        status: "ACTIVE",
        signedAt: completedAt,
        submissionId: submissionId ?? contract.submissionId,
        signedDocumentUrl,
        updatedAt: new Date(),
      },
    });

    // 3. Write immutable audit log for CONTRACT_SIGNED
    await tx.auditLog.create({
      data: {
        userId: contract.userId,
        operatorId,
        action: "CONTRACT_SIGNED",
        entityType: "CONTRACT",
        entityId: contract.id,
        reason: `Contract successfully executed via DocuSeal submission #${submissionId ?? "N/A"}`,
        metadata: JSON.stringify({
          contractNumber: contract.contractNumber,
          customerName: contract.customer.name,
          submissionId,
          signedDocumentUrl,
          submitters,
          signedAt: completedAt.toISOString(),
        }),
      },
    });

    let generatedInvoiceId: string | undefined;

    // 4. Optionally generate initial customer invoice for the executed contract
    if (createInitialInvoice && contract.value > 0) {
      // Check if an invoice for this contract has already been generated (look for contract reference in notes or description)
      const existingInvoice = await tx.invoice.findFirst({
        where: {
          userId: contract.userId,
          customerId: contract.customerId,
          notes: { contains: contract.contractNumber },
        },
      });

      if (!existingInvoice) {
        // Fetch sender details from companyProfile if available
        const profile = await tx.companyProfile.findUnique({
          where: { userId: contract.userId },
        });

        const invoiceCount = await tx.invoice.count({
          where: { userId: contract.userId },
        });
        const year = new Date().getFullYear();
        const invoiceNumber = `INV-${year}-${(invoiceCount + 1).toString().padStart(4, "0")}`;

        // Due date: 30 days from signing (or immediate if ONE_TIME)
        const dueDate = new Date(completedAt);
        if (contract.billingCycle === "ONE_TIME") {
          dueDate.setDate(dueDate.getDate() + 7);
        } else {
          dueDate.setDate(dueDate.getDate() + 30);
        }

        const invoice = await tx.invoice.create({
          data: {
            userId: contract.userId,
            customerId: contract.customerId,
            invoiceNumber,
            issueDate: completedAt,
            dueDate,
            status: "PENDING",
            currency: contract.currency,
            // Sender snapshot
            senderName: profile?.companyName || "Service Provider",
            senderEmail: profile?.email || "",
            senderPhone: profile?.phone || "",
            senderAddress: profile?.address || "",
            senderCity: profile?.city || "",
            senderZipCode: profile?.zipCode || "",
            senderCountry: profile?.country || "",
            senderTaxId: profile?.taxId || "",
            // Receiver snapshot
            receiverName: contract.customer.name,
            receiverEmail: contract.customer.email,
            receiverPhone: contract.customer.phone,
            receiverAddress: contract.customer.address,
            receiverCity: contract.customer.city,
            receiverZipCode: contract.customer.zipCode,
            receiverCountry: contract.customer.country,
            receiverTaxId: contract.customer.taxId,
            // Amounts
            subTotal: contract.value,
            taxRate: 0,
            taxAmount: 0,
            discountRate: 0,
            discountAmount: 0,
            shippingAmount: 0,
            totalAmount: contract.value,
            notes: `Auto-generated initial billing invoice for Contract ${contract.contractNumber} (${contract.title}).`,
            paymentTerms: profile?.paymentTerms || "Net 30 Days",
            bankName: profile?.bankName || "",
            bankAccountName: profile?.bankAccountName || "",
            bankAccountNumber: profile?.bankAccountNumber || "",
            items: {
              create: [
                {
                  description: `${contract.title} - Initial ${contract.billingCycle} Contract Commitment`,
                  quantity: 1,
                  unitPrice: contract.value,
                  total: contract.value,
                  orderIndex: 0,
                },
              ],
            },
          },
        });

        generatedInvoiceId = invoice.id;

        // Log invoice creation in audit log
        await tx.auditLog.create({
          data: {
            userId: contract.userId,
            operatorId,
            action: "INVOICE_GENERATED_FROM_CONTRACT",
            entityType: "INVOICE",
            entityId: invoice.id,
            reason: `Initial invoice generated automatically upon contract signature (${contract.contractNumber})`,
            metadata: JSON.stringify({
              contractId: contract.id,
              contractNumber: contract.contractNumber,
              invoiceNumber: invoice.invoiceNumber,
              totalAmount: invoice.totalAmount,
            }),
          },
        });
      }
    }

    return {
      contract: updatedContract,
      idempotentSkip: false,
      generatedInvoiceId,
      signedDocumentUrl: signedDocumentUrl ?? undefined,
    };
  });
}
