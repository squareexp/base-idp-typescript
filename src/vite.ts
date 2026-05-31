import { BaseIdPClient } from "./client.js";
import { createReactBaseIdpAuth } from "./react.js";
import type { ReactBaseIdpAuth } from "./react.js";
import type { BaseIdPConfig } from "./types.js";

export type ViteBaseIdpEnv = Record<string, string | boolean | undefined>;

export function baseIdpConfigFromViteEnv(
  env: ViteBaseIdpEnv,
  overrides: Partial<BaseIdPConfig> = {},
): BaseIdPConfig {
  return {
    key: stringEnv(env, "VITE_BASE_IDP_KEY", "BASE_IDP_KEY", overrides.key),
    issuer: stringEnv(env, "VITE_BASE_IDP_ISSUER", "BASE_IDP_ISSUER", overrides.issuer),
    secret: overrides.secret ?? optionalStringEnv(env, "VITE_BASE_IDP_SECRET", "BASE_IDP_SECRET"),
    fetch: overrides.fetch,
  };
}

export function createViteBaseIdpAuth(
  env: ViteBaseIdpEnv,
  overrides: Partial<BaseIdPConfig> = {},
): ReactBaseIdpAuth {
  return createReactBaseIdpAuth(new BaseIdPClient(baseIdpConfigFromViteEnv(env, overrides)));
}

function stringEnv(env: ViteBaseIdpEnv, publicKey: string, fallbackKey: string, fallback?: string): string {
  const value = optionalStringEnv(env, publicKey, fallbackKey) ?? fallback;
  if (!value) throw new Error(`Missing ${publicKey}`);
  return value;
}

function optionalStringEnv(env: ViteBaseIdpEnv, publicKey: string, fallbackKey: string): string | undefined {
  const value = env[publicKey] ?? env[fallbackKey];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
