"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight, Loader2, CheckCircle2, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { AppRoutes } from "~/config/routes";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token query
  const { data: tokenCheck, isLoading: isCheckingToken } = api.auth.verifyResetToken.useQuery(
    { token },
    { enabled: Boolean(token), retry: false }
  );

  const resetMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (err) => {
      setValidationError(err.message || "Failed to update password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!token) {
      setValidationError("Missing or invalid password reset token.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters in length.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    resetMutation.mutate({
      token,
      newPassword: password,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="border-border shadow-xl">
            <CardHeader className="p-6 text-center">
              <div className="mx-auto flex aspect-square size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-semibold">Missing Reset Token</CardTitle>
              <CardDescription className="text-xs">
                No password reset token was provided in the URL.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-6 pt-0 justify-center">
              <Link href={AppRoutes.FORGOT_PASSWORD}>
                <Button variant="outline" size="sm" className="text-xs">
                  Request New Password Reset
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Verifying security token...</span>
        </div>
      </div>
    );
  }

  if (tokenCheck && !tokenCheck.valid) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="border-border shadow-xl">
            <CardHeader className="p-6 text-center">
              <div className="mx-auto flex aspect-square size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <CardTitle className="text-base font-semibold">Expired or Invalid Token</CardTitle>
              <CardDescription className="text-xs">
                This password reset link has expired or has already been used. Please request a new link.
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-6 pt-0 justify-center">
              <Link href={AppRoutes.FORGOT_PASSWORD}>
                <Button size="sm" className="text-xs">
                  Request New Password Reset
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex aspect-square size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Set New Password
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {tokenCheck?.email ? `Resetting password for ${tokenCheck.email}` : "Choose a secure new password"}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="border-border shadow-xl backdrop-blur-sm">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-base font-semibold">
              {isSuccess ? "Password updated" : "Create your new password"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isSuccess
                ? "Your Client Portal credentials have been safely updated."
                : "Must be at least 8 characters long."}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            {validationError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-left">
                    <p className="font-semibold">Password changed successfully</p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      You can now log in to the Client Portal using your updated credentials.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => router.push(`${AppRoutes.SIGN_IN}?tab=portal`)}
                  className="w-full h-10 gap-2 text-xs font-semibold shadow-xs"
                >
                  <span>Sign In to Client Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>New Password</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={resetMutation.isPending}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Confirm Password</span>
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="p-4 bg-muted/30 border-t border-border flex justify-center">
            <Link
              href={`${AppRoutes.SIGN_IN}?tab=portal`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel and return to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
