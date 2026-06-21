const CORE_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const OPS_ENV = [
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_VERSION",
  "NEXT_PUBLIC_COMMIT_SHA",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_SHA",
] as const;

const OWNER_ENV = [
  "PLATFORM_ADMIN_EMAILS",
] as const;

const AI_ENV = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
] as const;

export const RELEASE_ENV_GROUPS = {
  core: CORE_ENV,
  operations: OPS_ENV,
  owner: OWNER_ENV,
  ai: AI_ENV,
} as const;

type EnvGroupName = keyof typeof RELEASE_ENV_GROUPS;

export type EnvPresence = Record<EnvGroupName, Record<string, boolean>>;

function presenceFor(names: readonly string[]): Record<string, boolean> {
  return Object.fromEntries(names.map((name) => [name, Boolean(process.env[name])]));
}

export function getReleaseEnvPresence(): EnvPresence {
  return {
    core: presenceFor(CORE_ENV),
    operations: presenceFor(OPS_ENV),
    owner: presenceFor(OWNER_ENV),
    ai: presenceFor(AI_ENV),
  };
}

export function getReleaseReadiness() {
  const env = getReleaseEnvPresence();
  const coreReady = CORE_ENV.every((name) => env.core[name]);
  const cronReady = env.operations.CRON_SECRET;

  return {
    envValidated: coreReady && cronReady,
    runtimeOk: true,
    deepCheckAvailable: Boolean(
      env.core.NEXT_PUBLIC_SUPABASE_URL &&
      env.core.SUPABASE_SERVICE_ROLE_KEY,
    ),
    requiredCoreEnvPresent: coreReady,
    cronEnvPresent: cronReady,
  };
}
