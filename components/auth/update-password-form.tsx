"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

function withMessage(pathname: string, key: "error" | "message", value: string) {
  return `${pathname}?${key}=${encodeURIComponent(value)}`;
}

export function UpdatePasswordForm({
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
          const password = String(formData.get("password") ?? "");

          try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.updateUser({ password });

            if (error || !data.user) {
              const nextError =
                error?.message ||
                "Your recovery session has expired. Request a new reset link.";
              setError(nextError);
              startTransition(() => router.replace(withMessage(pathname, "error", nextError)));
              return;
            }

            router.replace("/sign-in?message=Password updated. Sign in with your new password.");
            router.refresh();
          } catch (clientError) {
            const nextError =
              clientError instanceof Error
                ? clientError.message
                : "Unable to update your password.";
            setError(nextError);
            startTransition(() => router.replace(withMessage(pathname, "error", nextError)));
          } finally {
            setPending(false);
          }
        }}
      >
        <Input name="password" type="password" placeholder="New password" required />
        <Button className="w-full" variant="app" disabled={pending}>
          {pending ? "Updating..." : "Update password"}
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
