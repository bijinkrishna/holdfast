import type { ProjectEnvironment } from "@dm-holdfast/supabase-types";

const requiredKeys: Array<keyof ProjectEnvironment> = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
];

export function getServerEnv(): Partial<ProjectEnvironment> {
  return requiredKeys.reduce<Partial<ProjectEnvironment>>((acc, key) => {
    if (process.env[key]) {
      acc[key] = process.env[key] as ProjectEnvironment[typeof key];
    }
    return acc;
  }, {});
}

export function getMissingEnvKeys(): Array<keyof ProjectEnvironment> {
  return requiredKeys.filter((key) => !process.env[key]);
}

