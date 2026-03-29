import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env.js";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (client) {
    return client;
  }

  const env = getEnv();
  client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}
