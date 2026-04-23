import {
  DUPLICATE_SIGN_UP_MESSAGE,
  SIGN_UP_SUCCESS_MESSAGE,
  findExistingAuthUserByEmail,
  signUpWithEmail
} from "@/lib/auth-sign-up";

describe("auth sign up helper", () => {
  it("finds an existing user across paginated admin results", async () => {
    const listUsers = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          users: Array.from({ length: 200 }, (_, index) => ({
            email: `person-${index}@example.com`
          }))
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          users: [{ email: "cindyt07+test3@mit.edu" }]
        },
        error: null
      });

    const existingUser = await findExistingAuthUserByEmail("cindyt07+test3@mit.edu", {
      auth: {
        admin: {
          listUsers
        }
      }
    } as never);

    expect(existingUser).toEqual({ email: "cindyt07+test3@mit.edu" });
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 200 });
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 200 });
  });

  it("matches duplicate emails case-insensitively", async () => {
    const existingUser = await findExistingAuthUserByEmail("user@example.com", {
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [{ email: "USER@EXAMPLE.COM" }]
            },
            error: null
          })
        }
      }
    } as never);

    expect(existingUser).toEqual({ email: "USER@EXAMPLE.COM" });
  });

  it("throws when the admin lookup fails", async () => {
    await expect(
      findExistingAuthUserByEmail("user@example.com", {
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [] },
              error: { message: "admin down" }
            })
          }
        }
      } as never)
    ).rejects.toThrow("admin down");
  });

  it("blocks duplicate emails before calling Supabase signUp", async () => {
    const signUp = vi.fn();

    const result = await signUpWithEmail(
      {
        appUrl: "http://localhost:3005",
        displayName: "Cindy",
        email: "cindyt07+test3@mit.edu",
        password: "StrongPassword123"
      },
      {
        adminClient: {
          auth: {
            admin: {
              listUsers: vi.fn().mockResolvedValue({
                data: {
                  users: [{ email: "cindyt07+test3@mit.edu" }]
                },
                error: null
              })
            }
          }
        } as never,
        serverClient: {
          auth: {
            signUp
          }
        } as never
      }
    );

    expect(result).toEqual({
      ok: false,
      status: 409,
      message: DUPLICATE_SIGN_UP_MESSAGE
    });
    expect(signUp).not.toHaveBeenCalled();
  });

  it("creates a new account when the email is available", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-1"
        }
      },
      error: null
    });

    const result = await signUpWithEmail(
      {
        appUrl: "http://localhost:3005",
        displayName: "  Cindy  ",
        email: "CINDYT07+test4@mit.edu",
        password: "StrongPassword123"
      },
      {
        adminClient: {
          auth: {
            admin: {
              listUsers: vi.fn().mockResolvedValue({
                data: {
                  users: []
                },
                error: null
              })
            }
          }
        } as never,
        serverClient: {
          auth: {
            signUp
          }
        } as never
      }
    );

    expect(signUp).toHaveBeenCalledWith({
      email: "cindyt07+test4@mit.edu",
      password: "StrongPassword123",
      options: {
        emailRedirectTo: "http://localhost:3005/auth/confirm?next=/dashboard",
        data: {
          display_name: "Cindy",
          home_city: ""
        }
      }
    });
    expect(result).toEqual({
      ok: true,
      status: 201,
      message: SIGN_UP_SUCCESS_MESSAGE,
      userId: "user-1"
    });
  });

  it("still signs up when no admin client is available", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-2"
        }
      },
      error: null
    });

    const result = await signUpWithEmail(
      {
        appUrl: "http://localhost:3005",
        displayName: "Cindy",
        email: "new@example.com",
        password: "StrongPassword123"
      },
      {
        adminClient: null,
        serverClient: {
          auth: {
            signUp
          }
        } as never
      }
    );

    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com"
      })
    );
    expect(result).toEqual({
      ok: true,
      status: 201,
      message: SIGN_UP_SUCCESS_MESSAGE,
      userId: "user-2"
    });
  });

  it("returns a 400 when Supabase signUp fails", async () => {
    const result = await signUpWithEmail(
      {
        appUrl: "http://localhost:3005",
        displayName: "Cindy",
        email: "new@example.com",
        password: "StrongPassword123"
      },
      {
        adminClient: {
          auth: {
            admin: {
              listUsers: vi.fn().mockResolvedValue({
                data: {
                  users: []
                },
                error: null
              })
            }
          }
        } as never,
        serverClient: {
          auth: {
            signUp: vi.fn().mockResolvedValue({
              data: {
                user: null
              },
              error: { message: "Password is too weak." }
            })
          }
        } as never
      }
    );

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Password is too weak."
    });
  });
});
