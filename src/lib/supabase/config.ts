export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new SupabaseConfigError(`Missing required environment variable: ${name}`);
  }

  return value;
}

function validateSupabaseUrl(value: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new SupabaseConfigError("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new SupabaseConfigError("NEXT_PUBLIC_SUPABASE_URL must use http or https.");
  }

  return value.replace(/\/$/, "");
}

export function isSupabasePublicConfigAvailable() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = validateSupabaseUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL));
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return {
    url,
    anonKey
  };
}
