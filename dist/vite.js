import { SquareIdPClient } from "./client.js";
import { createReactSquareAuth } from "./react.js";
export function squareConfigFromViteEnv(env, overrides = {}) {
    return {
        issuer: stringEnv(env, "VITE_BASE_IDP_ISSUER", "BASE_IDP_ISSUER", overrides.issuer),
        clientId: stringEnv(env, "VITE_BASE_IDP_CLIENT_ID", "BASE_IDP_CLIENT_ID", overrides.clientId),
        redirectUri: stringEnv(env, "VITE_BASE_IDP_REDIRECT_URI", "BASE_IDP_REDIRECT_URI", overrides.redirectUri),
        scopes: overrides.scopes ?? stringEnv(env, "VITE_BASE_IDP_SCOPES", "BASE_IDP_SCOPES", "openid profile"),
        audience: overrides.audience ?? optionalStringEnv(env, "VITE_BASE_IDP_AUDIENCE", "BASE_IDP_AUDIENCE"),
        requiredScope: overrides.requiredScope ?? optionalStringEnv(env, "VITE_BASE_IDP_REQUIRED_SCOPE", "BASE_IDP_REQUIRED_SCOPE"),
        fetch: overrides.fetch,
    };
}
export function createViteSquareAuth(env, overrides = {}) {
    return createReactSquareAuth(new SquareIdPClient(squareConfigFromViteEnv(env, overrides)));
}
function stringEnv(env, publicKey, fallbackKey, fallback) {
    const value = optionalStringEnv(env, publicKey, fallbackKey) ?? fallback;
    if (!value) {
        throw new Error(`Missing ${publicKey}`);
    }
    return value;
}
function optionalStringEnv(env, publicKey, fallbackKey) {
    const value = env[publicKey] ?? env[fallbackKey];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
//# sourceMappingURL=vite.js.map