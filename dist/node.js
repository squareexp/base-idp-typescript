import { BaseIdPServerClient } from "./server.js";
import { idpError, BaseIdPError } from "./errors.js";
export function baseIdpConfigFromNodeEnv(env = process.env, overrides = {}) {
    return {
        key: requiredEnv(env, "BASE_IDP_KEY", overrides.key),
        issuer: requiredEnv(env, "BASE_IDP_ISSUER", overrides.issuer),
        secret: overrides.secret ?? env.BASE_IDP_CLIENT_SECRET ?? env.BASE_IDP_SECRET,
        fetch: overrides.fetch,
    };
}
export function readHeader(headers, name) {
    if (!headers)
        return null;
    const getter = typeof headers.get === "function" ? headers.get.bind(headers) : undefined;
    const fromGetter = getter?.(name) ?? getter?.(name.toLowerCase()) ?? getter?.(name.toUpperCase());
    if (fromGetter)
        return fromGetter;
    const record = headers;
    const raw = record[name] ?? record[name.toLowerCase()] ?? record[canonicalHeaderName(name)];
    if (Array.isArray(raw))
        return raw[0] ?? null;
    return raw ?? null;
}
export function bearerTokenFromHeaders(headers) {
    const value = readHeader(headers, "authorization");
    if (!value)
        return null;
    const match = value.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
}
export function bearerTokenFromRequest(request, options = {}) {
    const headerToken = bearerTokenFromHeaders(request.headers);
    if (headerToken)
        return headerToken;
    if (!options.cookieName)
        return null;
    const directCookie = request.cookies?.[options.cookieName];
    if (directCookie)
        return directCookie;
    const cookieHeader = readHeader(request.headers, "cookie");
    if (!cookieHeader)
        return null;
    return parseCookie(cookieHeader)[options.cookieName] ?? null;
}
export function createNodeBaseIdpAuth(configOrClient) {
    const client = configOrClient instanceof BaseIdPServerClient ? configOrClient : new BaseIdPServerClient(configOrClient);
    return {
        client,
        async verifyRequest(request, options = {}) {
            const token = bearerTokenFromRequest(request, options);
            if (!token) {
                throw idpError("missing_bearer_token", "missing bearer token");
            }
            const principal = await client.verifyAccessToken(token, options);
            if (options.attach !== false) {
                request.baseIdpPrincipal = principal;
                request.baseIdpClaims = principal.claims;
                if (options.attachUser)
                    request.user = principal;
            }
            return principal;
        },
        requireAuth(options = {}) {
            return async (request, response, next) => {
                try {
                    await this.verifyRequest(request, options);
                    next();
                }
                catch (error) {
                    if (options.errorBody === false) {
                        next(error);
                        return;
                    }
                    writeAuthError(response, error);
                }
            };
        },
    };
}
export function createExpressMiddleware(configOrClient, options = {}) {
    const auth = createNodeBaseIdpAuth(configOrClient);
    return async (request, response, next) => {
        try {
            await auth.verifyRequest(request, options);
            next();
        }
        catch (error) {
            if (options.errorBody === false) {
                next(error);
                return;
            }
            writeAuthError(response, error);
        }
    };
}
export function createNestBaseIdpGuard(configOrClient, options = {}) {
    const auth = createNodeBaseIdpAuth(configOrClient);
    return class BaseIdPNestGuard {
        async canActivate(context) {
            const request = context.switchToHttp().getRequest();
            await auth.verifyRequest(request, options);
            return true;
        }
    };
}
function writeAuthError(response, error) {
    const code = error instanceof BaseIdPError ? error.code : "unauthorized";
    const statusCode = code === "insufficient_scope" ? 403 : 401;
    const body = { error: code, error_description: error instanceof Error ? error.message : "unauthorized" };
    response.setHeader("WWW-Authenticate", `Bearer error="${code}"`);
    response.setHeader("Content-Type", "application/json");
    const maybeExpress = response;
    const status = maybeExpress.status;
    const json = maybeExpress.json;
    if (typeof status === "function" && typeof json === "function") {
        status.call(maybeExpress, statusCode);
        json.call(maybeExpress, body);
        return;
    }
    response.statusCode = statusCode;
    response.end(JSON.stringify(body));
}
function parseCookie(header) {
    const out = {};
    for (const part of header.split(";")) {
        const idx = part.indexOf("=");
        if (idx <= 0)
            continue;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (key)
            out[key] = decodeURIComponent(value);
    }
    return out;
}
function requiredEnv(env, name, override) {
    const value = override ?? env[name];
    if (!value)
        throw new Error(`${name} is required`);
    return value;
}
function canonicalHeaderName(name) {
    return name
        .split("-")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
        .join("-");
}
//# sourceMappingURL=node.js.map