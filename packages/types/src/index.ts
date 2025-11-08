export interface SupabaseCredentials {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export interface TwilioCredentials {
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
}

export type ProjectEnvironment = SupabaseCredentials & TwilioCredentials;

export interface SupabaseTable<T> {
  id: string;
  created_at: string;
  updated_at: string;
  data: T;
}

export interface SupabaseServiceConfig {
  credentials: SupabaseCredentials;
  serviceKey?: string;
}

export type EnvKey = keyof ProjectEnvironment;

