import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const USER_PAGE_SIZE = 200;

export const DUPLICATE_SIGN_UP_MESSAGE =
  "This email is already registered. Sign in instead or reset your password.";

export const SIGN_UP_SUCCESS_MESSAGE =
  "Account created. Check your email to verify your address before signing in.";

type AdminClientLike = NonNullable<ReturnType<typeof createAdminClient>>;
type ServerClientLike = Awaited<ReturnType<typeof createClient>>;

type SignUpInput = {
  appUrl: string;
  displayName: string;
  email: string;
  password: string;
};

type SignUpDependencies = {
  adminClient?: AdminClientLike | null;
  serverClient?: ServerClientLike;
};

type SignUpResult =
  | {
      ok: true;
      status: 201;
      message: string;
      userId: string | null;
    }
  | {
      ok: false;
      status: 400 | 409;
      message: string;
    };

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export async function findExistingAuthUserByEmail(
  email: string,
  adminClient: AdminClientLike | null = createAdminClient()
) {
  if (!adminClient) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USER_PAGE_SIZE
    });

    if (error) {
      throw new Error(error.message || "Unable to verify existing accounts.");
    }

    const users = data.users ?? [];
    const existingUser = users.find((user) => normalizeEmail(user.email) === normalizedEmail);

    if (existingUser) {
      return existingUser;
    }

    if (users.length < USER_PAGE_SIZE) {
      return null;
    }

    page += 1;
  }
}

export async function signUpWithEmail(
  input: SignUpInput,
  dependencies: SignUpDependencies = {}
): Promise<SignUpResult> {
  const adminClient =
    dependencies.adminClient === undefined ? createAdminClient() : dependencies.adminClient;
  const existingUser = await findExistingAuthUserByEmail(input.email, adminClient);

  if (existingUser) {
    return {
      ok: false,
      status: 409,
      message: DUPLICATE_SIGN_UP_MESSAGE
    };
  }

  const serverClient = dependencies.serverClient ?? (await createClient());
  const { data, error } = await serverClient.auth.signUp({
    email: normalizeEmail(input.email),
    password: input.password,
    options: {
      emailRedirectTo: `${input.appUrl}/auth/confirm?next=/dashboard`,
      data: {
        display_name: input.displayName.trim(),
        home_city: ""
      }
    }
  });

  if (error) {
    return {
      ok: false,
      status: 400,
      message: error.message || "Unable to create account."
    };
  }

  return {
    ok: true,
    status: 201,
    message: SIGN_UP_SUCCESS_MESSAGE,
    userId: data.user?.id ?? null
  };
}
