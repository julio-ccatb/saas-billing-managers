import { db } from "~/server/db";
import bcrypt from "bcryptjs";

export interface AuthorizeCredentialsInput {
  email?: string | null;
  password?: string | null;
  isDemo?: string | null;
}

export async function authorizeCredentials(credentials?: AuthorizeCredentialsInput | null) {
  const email = (credentials?.email as string)?.trim().toLowerCase();
  const password = (credentials?.password as string)?.trim();
  const isDemo = credentials?.isDemo === "true" || email === "demo@invoify.com";

  // 1. Operator Demo Access (One-click sandbox access for testing operators)
  if (isDemo && !password) {
    const demoEmail = "demo@invoify.com";
    const demoName = "Alex Morgan";
    let demoUser = await db.user.findUnique({
      where: { email: demoEmail },
      include: { clientProfile: true },
    });

    if (!demoUser) {
      demoUser = await db.user.create({
        data: {
          email: demoEmail,
          name: demoName,
          userRole: "OPERATOR",
          image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(demoName)}`,
        },
        include: { clientProfile: true },
      });

      await db.company.create({
        data: {
          name: "Acme Corp Operations",
          email: demoEmail,
          currency: "USD",
          paymentTerms: "Payment due upon receipt",
          notes: "Thank you for your business!",
          members: {
            create: {
              userId: demoUser.id,
              role: "OWNER",
            },
          },
        },
      });
    }

    return {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      image: demoUser.image,
      role: demoUser.userRole,
      customerId: demoUser.clientProfile?.id ?? null,
    };
  }

  // 2. Client Portal Authentication: requires email & password
  if (!email || !password) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      clientProfile: true,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  // Must be a client user or linked to a client customer account
  if (user.userRole !== "CLIENT" && !user.clientProfile) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.userRole,
    customerId: user.clientProfile?.id ?? null,
  };
}
