import { SquareIdPServerClient } from "./server.js";
import { idpError, SquareIdPError } from "./errors.js";
export function squareConfigFromNodeEnv(env = process.env, overrides = {}) {
    return {
        issuer: requiredEnv(env, "BASE_IDP_ISSUER", overrides.issuer),
        clientId: requiredEnv(env, "BASE_IDP_CLIENT_ID", overrides.clientId),
        clientSecret: overrides.clientSecret ?? env.BASE_IDP_CLIENT_SECRET,
        redirectUri: requiredEnv(env, "BASE_IDP_REDIRECT_URI", overrides.redirectUri),
        scopes: overrides.scopes ?? env.BASE_IDP_SCOPES ?? "openid profile",
        audience: overrides.audience ?? env.BASE_IDP_AUDIENCE,
        requiredScope: overrides.requiredScope ?? env.BASE_IDP_REQUIRED_SCOPE,
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
export function createNodeSquareAuth(configOrClient) {
    const client = configOrClient instanceof SquareIdPServerClient ? configOrClient : new SquareIdPServerClient(configOrClient);
    return {
        client,
        async verifyRequest(request, options = {}) {
            const token = bearerTokenFromRequest(request, options);
            if (!token) {
                throw idpError("missing_bearer_token", "missing bearer token");
            }
            const principal = await client.verifyAccessToken(token, options);
            if (options.attach !== false) {
                request.squarePrincipal = principal;
                request.squareClaims = principal.claims;
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
    const auth = createNodeSquareAuth(configOrClient);
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
export function createNestSquareGuard(configOrClient, options = {}) {
    const auth = createNodeSquareAuth(configOrClient);
    return class SquareIdPNestGuard {
        async canActivate(context) {
            const request = context.switchToHttp().getRequest();
            await auth.verifyRequest(request, options);
            return true;
        }
    };
}
function writeAuthError(response, error) {
    const code = error instanceof SquareIdPError ? error.code : "unauthorized";
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
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
}
function canonicalHeaderName(name) {
    return name
        .split("-")
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
        .join("-");
}
//# sourceMappingURL=node.js.map