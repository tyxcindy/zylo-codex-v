import { getProviderStatus } from "@/lib/provider-status";

describe("provider status", () => {
  it("marks configured providers when env values exist", () => {
    const status = getProviderStatus({
      geminiApiKey: "test",
      googleMapsApiKey: "test",
      unsplashAccessKey: "test",
      unsplashSecretKey: "test",
      supabaseUrl: "https://example.supabase.co",
      supabasePublicKey: "publishable",
      supabaseServiceRoleKey: "service",
      resendApiKey: "re_test"
    });

    expect(status.gemini).toBe("configured");
    expect(status.googleMaps).toBe("configured");
    expect(status.unsplash).toBe("configured");
    expect(status.supabase).toBe("configured");
    expect(status.resend).toBe("configured");
  });

  it("marks missing providers when env values are absent", () => {
    const status = getProviderStatus({});

    expect(status.gemini).toBe("missing");
    expect(status.googleMaps).toBe("missing");
    expect(status.unsplash).toBe("missing");
    expect(status.supabase).toBe("missing");
    expect(status.resend).toBe("missing");
  });
});
