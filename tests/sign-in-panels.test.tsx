import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SignInPanels } from "@/components/auth/sign-in-panels";

const replace = vi.fn();

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    useFormStatus: () => ({ pending: false })
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    push: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => "/sign-in",
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/app/sign-in/actions", () => ({
  signInAction: vi.fn()
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
