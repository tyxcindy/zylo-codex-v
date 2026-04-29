"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";

import { signInAction } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/client/api";
import { signUpWithApi } from "@/lib/client/auth-sign-up";

function withMessage(pathname: string, key: "error" | "message", value: string, next?: string) {
  const params = new URLSearchParams();
  params.set(key, value);

  if (next) {
    params.set("next", next);
  }

  return `${pathname}?${params.toString()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const normalized = message.toLowerCase();

  if (normalized.includes("failed to fetch")) {
    return "Auth could not reach Supabase. Re-copy the Supabase publishable key and turn off Auth CAPTCHA for now.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Check your email and verify your address before signing in.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("invalid api key")) {
    return "Supabase rejected the public auth key. Use the project publishable key, not a stale anon key.";
  }

  if (normalized.includes("captcha")) {
    return "Supabase Auth CAPTCHA is on. Disable it for now or add CAPTCHA token handling before signup.";
  }

  if (
    normalized.includes("redirect") &&
    (normalized.includes("allow") || normalized.includes("invalid"))
  ) {
    return "This Zylo URL is not allowed in Supabase Auth redirects yet.";
  }

  return message || fallback;
}

function SignInSubmitButton({
  disabled
}: {
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full !border !border-[color:var(--line)] !bg-[color:var(--surface-2)] !text-[color:var(--text)] hover:!opacity-100"
      variant="app"
      disabled={pending || disabled}
    >
      {pending ? "Signing in..." : "Continue"}
    </Button>
  );
}

export function SignInPanels({
  initialError,
  initialMessage,
  next = "/dashboard"
}: {
  initialError?: string;
  initialMessage?: string;
  next?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [signUpPending, setSignUpPending] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  useEffect(() => {
    setError(initialError ?? "");
  }, [initialError]);

  useEffect(() => {
    setMessage(initialMessage ?? "");
  }, [initialMessage]);

  const replaceMessage = (key: "error" | "message", value: string) => {
    setError(key === "error" ? value : "");
    setMessage(key === "message" ? value : "");
    startTransition(() => {
      router.replace(withMessage(pathname, key, value, next));
    });
  };

  const clearMessages = () => {
    setError("");
    setMessage("");

    if (searchParams.size > 0) {
      startTransition(() => {
        router.replace(next ? `${pathname}?next=${encodeURIComponent(next)}` : pathname);
      });
    }
  };

  const handleSignUp = async () => {
    setSignUpPending(true);
    clearMessages();

    try {
      const payload = await signUpWithApi({
        displayName: signUpDisplayName,
        email: signUpEmail,
        password: signUpPassword
      });
      const nextMessage =
        payload.message ||
        "Account created. Check your email to verify your address before signing in.";

      setError("");
      setMessage(nextMessage);
      setSignUpDisplayName("");
      setSignUpEmail("");
      setSignUpPassword("");
      startTransition(() => {
        router.replace(withMessage(pathname, "message", nextMessage, next));
      });
    } catch (clientError) {
      replaceMessage(
        "error",
        getErrorMessage(
          new Error(getApiErrorMessage(clientError, "Unable to create account.")),
          "Unable to create account."
        )
      );
    } finally {
      setSignUpPending(false);
    }
  };

  return (
    <>
      <div className="glass-panel p-8">
        <h2 className="text-2xl">Sign in</h2>
        {error ? <p className="status-error mt-4 rounded-2xl px-4 py-3 text-sm">{error}</p> : null}
        {message ? (
          <p className="status-success mt-4 rounded-2xl px-4 py-3 text-sm">{message}</p>
        ) : null}
        <form
          action={signInAction}
          className="mt-6 space-y-4"
          onSubmit={() => {
            setError("");
            setMessage("");
          }}
        >
          <Input
            name="email"
            placeholder="Email address"
            type="email"
            required
            value={signInEmail}
            onChange={(event) => setSignInEmail(event.target.value)}
          />
          <Input
            name="password"
            placeholder="Password"
            type="password"
            required
            value={signInPassword}
            onChange={(event) => setSignInPassword(event.target.value)}
          />
          <input type="hidden" name="next" value={next} />
          <SignInSubmitButton disabled={!signInEmail.trim() || !signInPassword} />
        </form>
        <p className="mt-6 text-sm text-[color:var(--text-soft)]">
          Forgot it?{" "}
          <Link href="/forgot-password" className="font-semibold text-[color:var(--text)]">
            Reset your password
          </Link>
        </p>
      </div>
      <div className="glass-panel p-8">
        <h2 className="text-2xl">Create account</h2>
        <div className="mt-6 space-y-4">
          <Input
            name="displayName"
            placeholder="Display name"
            required
            value={signUpDisplayName}
            onChange={(event) => setSignUpDisplayName(event.target.value)}
          />
          <Input
            name="email"
            placeholder="Email address"
            type="email"
            required
            value={signUpEmail}
            onChange={(event) => setSignUpEmail(event.target.value)}
          />
          <Input
            name="password"
            placeholder="Password"
            type="password"
            required
            value={signUpPassword}
            onChange={(event) => setSignUpPassword(event.target.value)}
          />
          <Button
            type="button"
            className="w-full"
            variant="ghost"
            disabled={
              signUpPending ||
              !signUpDisplayName.trim() ||
              !signUpEmail.trim() ||
              !signUpPassword
            }
            onClick={handleSignUp}
          >
            {signUpPending ? "Creating..." : "Create account"}
          </Button>
        </div>
      </div>
    </>
  );
}
