import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "~/server/db";

import { env } from "~/env";

import bcrypt from "bcryptjs";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      customerId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    customerId?: string | null;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text", placeholder: "User" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = (credentials?.password as string)?.trim();
        const name = (credentials?.name as string)?.trim() || "User";

        if (!email) {
          return null;
        }

        // 1. Look for existing user
        let user = await db.user.findUnique({
          where: { email },
          include: {
            clientProfile: true,
          },
        });

        // 2. If password provided, verify hash
        if (password) {
          if (!user || !user.passwordHash) {
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

        // 3. Passwordless / Demo fallback for testing operator
        if (!user) {
          user = await db.user.create({
            data: {
              email,
              name,
              userRole: "OPERATOR",
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            },
            include: {
              clientProfile: true,
            },
          });

          // Pre-populate company workspace for the operator user
          await db.company.create({
            data: {
              name: `${name}'s Workspace`,
              email,
              currency: "USD",
              paymentTerms: "Payment due upon receipt",
              notes: "Thank you for your business!",
              members: {
                create: {
                  userId: user.id,
                  role: "OWNER",
                },
              },
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.userRole,
          customerId: user.clientProfile?.id ?? null,
        };
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "OPERATOR";
        token.customerId = user.customerId ?? null;
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: (token.id as string) ?? session.user.id,
        role: (token.role as string) ?? "OPERATOR",
        customerId: (token.customerId as string | null) ?? null,
      },
    }),
  },
} satisfies NextAuthConfig;

