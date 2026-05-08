import { SquareIdPClient } from "./client.js";
import { createReactSquareAuth } from "./react.js";
import type { ReactSquareAuth } from "./react.js";
import type { SquareIdPConfig } from "./types.js";

export type ViteSquareEnv = Record<string, string | boolean | undefined>;

export function squareConfigFromViteEnv(
  env: ViteSquareEnv,
  overrides: Partial<SquareIdPConfig> = {},
): SquareIdPConfig {
  return {
    issuer: stringEnv(env, "VITE_BASE_IDP_ISSUER", "BASE_IDP_ISSUER", overrides.issuer),
    clientId: stringEnv(env, "VITE_BASE_IDP_CLIENT_ID", "BASE_IDP_CLIENT_ID", overrides.clientId),
    redirectUri: stringEnv(env, "VITE_BASE_IDP_REDIRECT_URI", "BASE_IDP_REDIRECT_URI", overrides.redirectUri),
    scopes: overrides.scopes ?? stringEnv(env, "VITE_BASE_IDP_SCOPES", "BASE_IDP_SCOPES", "openid profile"),
    audience: overrides.audience ?? optionalStringEnv(env, "VITE_BASE_IDP_AUDIENCE", "BASE_IDP_AUDIENCE"),
    requiredScope:
      overrides.requiredScope ?? optionalStringEnv(env, "VITE_BASE_IDP_REQUIRED_SCOPE", "BASE_IDP_REQUIRED_SCOPE"),
    fetch: overrides.fetch,
  };
}

export function createViteSquareAuth(
  env: ViteSquareEnv,
  overrides: Partial<SquareIdPConfig> = {},
): ReactSquareAuth {
  return createReactSquareAuth(new SquareIdPClient(squareConfigFromViteEnv(env, overrides)));
}

function stringEnv(env: ViteSquareEnv, publicKey: string, fallbackKey: string, fallback?: string): string {
  const value = optionalStringEnv(env, publicKey, fallbackKey) ?? fallback;
  if (!value) {
    throw new Error(`Missing ${publicKey}`);
  }
  return value;
}

function optionalStringEnv(env: ViteSquareEnv, publicKey: string, fallbackKey: string): string | undefined {
  const value = env[publicKey] ?? env[fallbackKey];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
