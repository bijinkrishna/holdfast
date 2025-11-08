const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `\n[env] Missing required environment variables: ${missing.join(", ")}\n`,
  );
  process.exit(1);
}

console.log("[env] All required environment variables are present.");

