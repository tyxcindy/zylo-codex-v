import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SignInPanels } from "@/components/auth/sign-in-panels";

const replace = vi.fn();
const push = vi.fn();
const refresh = vi.fn();
const signInWithPassword = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    push,
    refresh
  }),
  usePathname: () => "/sign-in",
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword
    }
  })
}));

function getSignUpFields() {
  const [_, signUpEmail] = screen.getAllByPlaceholderText(/Email address/i);
  const [__, signUpPassword] = screen.getAllByPlaceholderText(/Password/i);

  return {
    displayName: screen.getByPlaceholderText(/Display name/i),
    email: signUpEmail,
    password: signUpPassword
  };
}

describe("SignInPanels", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replace.mockReset();
    push.mockReset();
    refresh.mockReset();
    signInWithPassword.mockReset();
  });

  it("shows the duplicate-email error returned by the signup API", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "This email is already registered. Sign in instead or reset your password."
      })
    } as Response);

    render(<SignInPanels next="/dashboard" />);

    const fields = getSignUpFields();
    fireEvent.change(fields.displayName, { target: { value: "Cindy" } });
    fireEvent.change(fields.email, { target: { value: "cindyt07+test3@mit.edu" } });
    fireEvent.change(fields.password, { target: { value: "StrongPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/This email is already registered\. Sign in instead or reset your password\./i)
      ).toBeInTheDocument()
    );

    expect(screen.queryByText(/Account created/i)).not.toBeInTheDocument();
  });

  it("shows the success message and clears signup fields", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        message: "Account created. Check your email to verify your address before signing in."
      })
    } as Response);

    render(<SignInPanels next="/dashboard" />);

    const fields = getSignUpFields();
    fireEvent.change(fields.displayName, { target: { value: "Cindy" } });
    fireEvent.change(fields.email, { target: { value: "new@example.com" } });
    fireEvent.change(fields.password, { target: { value: "StrongPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText(/Account created\. Check your email/i)).toBeInTheDocument()
    );

    expect(fields.displayName).toHaveValue("");
    expect(fields.email).toHaveValue("");
    expect(fields.password).toHaveValue("");
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("message="));
  });
});
