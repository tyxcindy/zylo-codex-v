import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Button } from "@/components/ui/button";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="page-shell py-12">
      <div className="glass-panel mx-auto max-w-2xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
          Password reset
        </p>
        <h1 className="mt-4 text-5xl">Request a fresh reset link.</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
          Reset links should be single-use and time-bound. If yours expired, request a new one here.
        </p>
        <ForgotPasswordForm
          initialError={params.error}
          initialMessage={params.message}
        />
      </div>
    </div>
  );
}
