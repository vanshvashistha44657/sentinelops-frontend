import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch } from "@/services/api-client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — SentinelOps" },
      {
        name: "description",
        content: "Set a new SentinelOps password using a single-use recovery link.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({ password: z.string().min(10, "Use at least 10 characters"), confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });
  const token =
    typeof window === "undefined"
      ? ""
      : new URLSearchParams(window.location.search).get("token") || "";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel w-full max-w-md p-7">
        {complete ? (
          <div className="text-center">
            <ShieldCheck className="mx-auto size-10 text-success" />
            <h1 className="mt-4 text-lg font-semibold">Password updated</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your recovery link can no longer be reused. Sign in with your new password.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <span className="flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
              <KeyRound className="size-5 text-primary" />
            </span>
            <h1 className="mt-4 text-lg font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The link expires after 30 minutes and can only be used once.
            </p>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form
              className="mt-5 space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                setError(null);
                try {
                  if (!token) throw new Error("This password reset link is missing its token.");
                  await apiFetch<{ ok: true }>("/auth/reset-password", {
                    method: "POST",
                    body: JSON.stringify({ token, password: values.password }),
                  });
                  setComplete(true);
                  setTimeout(() => void navigate({ to: "/" }), 1500);
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Unable to reset password.");
                }
              })}
            >
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  {...form.register("confirm")}
                />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />} Update
                password
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
