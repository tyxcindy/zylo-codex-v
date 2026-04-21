import Link from "next/link";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default async function UpdatePasswordPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="page-shell py-12">
      <div className="glass-panel mx-auto max-w-2xl p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--text-soft)]">
          Secure account
        </p>
        <h1 className="mt-4 text-5xl">Set a new password.</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--text-soft)]">
          Use a strong password with at least 12 characters, mixed case, and a number.
        </p>
        <UpdatePasswordForm
          initialError={params.error}
          initialMessage={params.message}
        />
      </div>
    </div>
  );
}
