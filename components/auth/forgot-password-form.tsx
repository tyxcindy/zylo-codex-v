"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

function getAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function withMessage(pathname: string, key: "error" | "message", value: string) {
  return `${pathname}?${key}=${encodeURIComponent(value)}`;
}

export function ForgotPasswordForm({
  initialError,
  initialMessage
}: {
  initialError?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");

  return (
    <>
      {error ? <p className="status-error mt-6 rounded-2xl px-4 py-3 text-sm">{error}</p> : null}
      {message ? (
        <p className="status-success mt-6 rounded-2xl px-4 py-3 text-sm">{message}</p>
      ) : null}
      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          setMessage("");

          const formData = new FormData(event.currentTarget);
          const email = String(formData.get("email") ?? "").trim().toLowerCase();

          try {
            const supabase = createClient();
            const appUrl = getAppUrl();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${appUrl}/auth/confirm?next=/update-password`
            });

            if (error) {
              const nextError = error.message || "Unable to request a reset link.";
              setError(nextError);
              startTransition(() => router.replace(withMessage(pathname, "error", nextError)));
              return;
            }

            const nextMessage = "If that email exists, a password reset link has been sent.";
            setMessage(nextMessage);
            startTransition(() => router.replace(withMessage(pathname, "message", nextMessage)));
          } catch (clientError) {
            const nextError =
              clientError instanceof Error
                ? clientError.message
                : "Unable to request a reset link.";
            setError(nextError);
            startTransition(() => router.replace(withMessage(pathname, "error", nextError)));
          } finally {
            setPending(false);
          }
        }}
      >
        <Input name="email" type="email" placeholder="Email address" required />
        <Button className="w-full" variant="app" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-[color:var(--text-soft)]">
        Back to{" "}
        <Link href="/sign-in" className="font-semibold text-[color:var(--text)]">
          sign in
        </Link>
        .
      </p>
    </>
  );
}
