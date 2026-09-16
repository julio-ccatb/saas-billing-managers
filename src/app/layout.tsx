import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthSessionProvider } from "~/components/auth/SessionProvider";
import { Toaster } from "~/components/ui/toast";

export const metadata: Metadata = {
  title: "Invoify SaaS Billing Manager",
  description: "Enterprise invoice creation, tracking, and customer billing manager",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <AuthSessionProvider>
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
