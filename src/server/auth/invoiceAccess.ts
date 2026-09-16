import { type PrismaClient } from "@prisma/client";

export interface InvoiceAccessSubject {
  id: string;
  companyId: string;
  customerId: string | null;
  receiverEmail?: string | null;
  userId: string;
}

export interface InvoiceAccessUser {
  id: string;
  role?: string;
  email?: string | null;
  customerId?: string | null;
}

/**
 * Validates whether an authenticated user is permitted to view/download a given invoice.
 *
 * Rules:
 * 1. The user created the invoice (creator match).
 * 2. The user is a member/admin/owner of the company that issued the invoice (CompanyMember record).
 * 3. The user is a customer linked to the invoice (by customerId, clientUserId, or verified email).
 * 4. The user's verified email matches the invoice's receiver email.
 */
export async function canUserAccessInvoice(
  db: PrismaClient,
  invoice: InvoiceAccessSubject,
  user: InvoiceAccessUser
): Promise<boolean> {
  if (!user?.id) {
    return false;
  }

  // 1. Direct creator
  if (invoice.userId === user.id) {
    return true;
  }

  // 2. Active Company Member (OWNER, ADMIN, MEMBER)
  if (invoice.companyId) {
    const membership = await db.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: invoice.companyId,
          userId: user.id,
        },
      },
      select: { id: true, role: true },
    });

    if (membership) {
      return true;
    }
  }

  // Resolve user email
  let userEmail = user.email ? user.email.trim().toLowerCase() : null;
  if (!userEmail) {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    if (dbUser?.email) {
      userEmail = dbUser.email.trim().toLowerCase();
    }
  }

  // Find all customer entities linked to this client user
  const linkedCustomers = await db.customer.findMany({
    where: {
      OR: [
        { clientUserId: user.id },
        ...(user.customerId ? [{ id: user.customerId }] : []),
        ...(userEmail ? [{ email: { equals: userEmail, mode: "insensitive" } }] : []),
      ],
    },
    select: { id: true, email: true },
  });

  const linkedCustomerIds = new Set(linkedCustomers.map((c: { id: string; email: string }) => c.id));
  if (user.customerId) {
    linkedCustomerIds.add(user.customerId);
  }

  // 3. Customer match by customerId
  if (invoice.customerId && linkedCustomerIds.has(invoice.customerId)) {
    return true;
  }

  if (invoice.customerId) {
    const customer = await db.customer.findUnique({
      where: { id: invoice.customerId },
      select: { id: true, clientUserId: true, email: true },
    });

    if (customer) {
      if (customer.clientUserId && customer.clientUserId === user.id) {
        return true;
      }
      if (
        userEmail &&
        customer.email &&
        customer.email.trim().toLowerCase() === userEmail
      ) {
        return true;
      }
    }
  }

  // 4. Receiver email match (against user email or any of user's linked customer emails)
  const receiverEmail = invoice.receiverEmail ? invoice.receiverEmail.trim().toLowerCase() : null;
  if (receiverEmail) {
    if (userEmail && receiverEmail === userEmail) {
      return true;
    }
    for (const c of linkedCustomers) {
      if (c.email && c.email.trim().toLowerCase() === receiverEmail) {
        return true;
      }
    }
  }

  return false;
}
