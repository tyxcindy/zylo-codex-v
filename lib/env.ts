type ServerEnv = {
  geminiApiKey?: string;
  googleMapsApiKey?: string;
  unsplashAccessKey?: string;
  unsplashSecretKey?: string;
  supabaseUrl?: string;
  supabasePublicKey?: string;
  supabaseServiceRoleKey?: string;
  resendApiKey?: string;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readPublicEnv(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function getServerEnv(): ServerEnv {
  const supabasePublicKey =
    readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return {
    geminiApiKey: readEnv("GEMINI_API_KEY"),
    googleMapsApiKey: readEnv("GOOGLE_MAPS_API_KEY"),
    unsplashAccessKey: readEnv("UNSPLASH_ACCESS_KEY"),
    unsplashSecretKey: readEnv("UNSPLASH_SECRET_KEY"),
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublicKey,
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    resendApiKey: readEnv("RESEND_API_KEY")
  };
}

export function getPublicEnv() {
  const supabasePublicKey =
    readPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    readPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    supabaseUrl: readPublicEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: supabasePublicKey
  };
}
