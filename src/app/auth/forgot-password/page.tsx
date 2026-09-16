"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { AppRoutes } from "~/config/routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const resetMutation = api.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      setSubmitted(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    resetMutation.mutate({ email: email.trim().toLowerCase() });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex aspect-square size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Self-Service Password Reset
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Client Portal security &amp; account recovery
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="border-border shadow-xl backdrop-blur-sm">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-base font-semibold">
              {submitted ? "Check your email" : "Reset your password"}
            </CardTitle>
            <CardDescription className="text-xs">
              {submitted
                ? `If an account with ${email} exists, we have sent instructions to reset your password.`
                : "Enter your registered client email address and we will dispatch a secure reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            {resetMutation.isError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetMutation.error.message || "Failed to process password reset request."}</span>
              </div>
            )}

            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Reset instructions sent</p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      The link expires in 1 hour. Please check your spam folder if you do not see it in your inbox.
                    </p>
                  </div>
                </div>

                {/* Local development quick-link when running in dev mode */}
                {devResetUrl && (
                  <div className="rounded-lg border border-border bg-muted/60 p-3 space-y-1.5 text-left">
                    <span className="text-[10px] font-mono font-semibold text-primary uppercase">
                      Dev Environment Quick Access:
                    </span>
                    <p className="text-xs break-all">
                      <Link
                        href={devResetUrl}
                        className="text-primary underline hover:text-primary/80 font-mono text-[11px]"
                      >
                        {devResetUrl}
                      </Link>
                    </p>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                    setDevResetUrl(null);
                  }}
                  className="w-full text-xs"
                >
                  Send to a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Authorized Client Email</span>
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={resetMutation.isPending}
                    className="h-10"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full h-10 gap-2 text-xs font-semibold shadow-xs"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching link...</span>
                    </>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="p-4 bg-muted/30 border-t border-border flex justify-center">
            <Link
              href={`${AppRoutes.SIGN_IN}?tab=portal`}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Client Portal Login</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
