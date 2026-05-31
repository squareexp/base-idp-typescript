import { BaseIdPClient } from "./client.js";
import { createReactBaseIdpAuth } from "./react.js";
export function baseIdpConfigFromViteEnv(env, overrides = {}) {
    return {
        key: stringEnv(env, "VITE_BASE_IDP_KEY", "BASE_IDP_KEY", overrides.key),
        issuer: stringEnv(env, "VITE_BASE_IDP_ISSUER", "BASE_IDP_ISSUER", overrides.issuer),
        secret: overrides.secret ?? optionalStringEnv(env, "VITE_BASE_IDP_SECRET", "BASE_IDP_SECRET"),
        fetch: overrides.fetch,
    };
}
export function createViteBaseIdpAuth(env, overrides = {}) {
    return createReactBaseIdpAuth(new BaseIdPClient(baseIdpConfigFromViteEnv(env, overrides)));
}
function stringEnv(env, publicKey, fallbackKey, fallback) {
    const value = optionalStringEnv(env, publicKey, fallbackKey) ?? fallback;
    if (!value)
        throw new Error(`Missing ${publicKey}`);
    return value;
}
function optionalStringEnv(env, publicKey, fallbackKey) {
    const value = env[publicKey] ?? env[fallbackKey];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
//# sourceMappingURL=vite.js.map