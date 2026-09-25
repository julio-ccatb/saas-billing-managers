import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthSessionProvider } from "~/components/auth/SessionProvider";
import { Toaster } from "~/components/ui/toast";

export const metadata: Metadata = {
  title: "Invoify SaaS Billing Manager",
  description: "Enterprise invoice creation, tracking, and customer billing manager",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${geistMono.variable}`}>
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
