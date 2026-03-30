/**
 * Environment parsing for the server process.
 */
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_BASE_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Returns the validated server environment.
 */
export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}
