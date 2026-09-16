"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Building2,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSignInSchema, type ClientSignInValues } from "~/lib/schemas/forms";
import { AppRoutes } from "~/config/routes";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "portal" ? "portal" : "operator";

  const [activeTab, setActiveTab] = useState(initialTab);

  // Client credentials form
  const [clientError, setClientError] = useState<string | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(false);

  const clientForm = useForm<ClientSignInValues>({
    resolver: zodResolver(clientSignInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Operator states
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [operatorError, setOperatorError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "portal" || tabParam === "operator") {
      setActiveTab(tabParam);
    }
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (activeTab === "portal") {
        setClientError("Authentication failed. Please verify your client credentials.");
      } else {
        setOperatorError("Authentication error during operator sign-in. Please try again.");
      }
    }
  }, [searchParams, activeTab]);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setOperatorError(null);
      await signIn("google", { callbackUrl: AppRoutes.DASHBOARD });
    } catch (err: any) {
      setOperatorError(err?.message || "Failed to initiate Google sign-in.");
      setIsGoogleLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setIsDemoLoading(true);
      setOperatorError(null);
      const res = await signIn("credentials", {
        email: "demo@invoify.com",
        isDemo: "true",
        redirect: false,
      });

      if (res?.error) {
        setOperatorError("Failed to initialize demo workspace.");
        setIsDemoLoading(false);
      } else {
        router.push(AppRoutes.DASHBOARD);
        router.refresh();
      }
    } catch (err: any) {
      setOperatorError(err?.message || "Failed to initialize demo workspace.");
      setIsDemoLoading(false);
    }
  };

  const handleClientLogin = async (data: ClientSignInValues) => {
    setClientError(null);
    setIsClientLoading(true);

    try {
      const res = await signIn("credentials", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        setClientError("Invalid client email or password. Please verify credentials or reset your password.");
        setIsClientLoading(false);
      } else {
        router.push(AppRoutes.PORTAL);
        router.refresh();
      }
    } catch (err: any) {
      setClientError(err?.message || "An unexpected error occurred. Please try again.");
      setIsClientLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow adhering to theme variables */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand & Central Identity */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex aspect-square size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Invoify Operations &amp; Billing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Unified access control for operators and client billing portals
        </p>
      </div>

      {/* Unified Tabbed Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="border-border shadow-xl backdrop-blur-sm">
          <CardHeader className="p-6 pb-4 border-b border-border/60">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as string);
                setClientError(null);
                setOperatorError(null);
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted rounded-lg">
                <TabsTrigger
                  value="operator"
                  className="gap-2 text-xs font-semibold py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Command Center</span>
                </TabsTrigger>
                <TabsTrigger
                  value="portal"
                  className="gap-2 text-xs font-semibold py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Client Portal</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6 pt-5">
            {/* 1. OPERATOR TAB: Google OAuth & Demo Sandbox */}
            {activeTab === "operator" && (
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <h3 className="text-sm font-semibold text-foreground">
                    Operator Workspace Authentication
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Internal billing managers and company administrators must authenticate using corporate Google credentials.
                  </p>
                </div>

                {operatorError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{operatorError}</span>
                  </div>
                )}

                {/* Primary Action: Google OAuth */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={isGoogleLoading || isDemoLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-11 border-border/80 hover:bg-muted/80 text-foreground font-medium text-xs flex items-center justify-center gap-3 cursor-pointer shadow-xs"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google Workspace</span>
                    </>
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                    <span className="bg-card px-2 text-muted-foreground">Sandbox &amp; Demo</span>
                  </div>
                </div>

                {/* Secondary Action: Demo Sandbox Access */}
                <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Instant Operator Demo</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Sandbox
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Test the complete invoice builder, client ledger, and license management workflows without Google setup.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isGoogleLoading || isDemoLoading}
                    onClick={handleDemoSignIn}
                    className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {isDemoLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Launching Demo...</span>
                      </>
                    ) : (
                      <>
                        <span>Launch Demo Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 2. CLIENT PORTAL TAB: Email & Password */}
            {activeTab === "portal" && (
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <h3 className="text-sm font-semibold text-foreground">
                    Client Portal Access
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter your authorized corporate email and password to view your active invoices, licenses, and contracts.
                  </p>
                </div>

                {clientError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{clientError}</span>
                  </div>
                )}

                <Form {...clientForm}>
                  <form onSubmit={clientForm.handleSubmit(handleClientLogin)} className="space-y-3.5">
                    <FormField
                      control={clientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="text-left">
                          <FormLabel className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Authorized Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="client@company.com"
                              disabled={isClientLoading}
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="text-left">
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Password</span>
                            </FormLabel>
                            <Link
                              href={AppRoutes.FORGOT_PASSWORD}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••••••"
                              disabled={isClientLoading}
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isClientLoading}
                      className="w-full h-10 mt-1 gap-2 text-xs font-semibold shadow-xs"
                    >
                      {isClientLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter Client Portal</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    First time accessing? Contact your account administrator to receive portal invitation credentials.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 bg-muted/30 border-t border-border text-center justify-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Encrypted multi-tenant session isolation</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
