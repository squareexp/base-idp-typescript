import { SquareIdPServerClient } from "./server.js";
import { idpError, SquareIdPError } from "./errors.js";
import type { SquareIdPConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";

export type HeaderBag =
  | Headers
  | {
      get?(name: string): string | null | undefined;
      authorization?: string | string[];
      Authorization?: string | string[];
      cookie?: string | string[];
      Cookie?: string | string[];
      [key: string]: string | string[] | ((name: string) => string | null | undefined) | undefined;
    };

export type NodeRequestLike = {
  headers: HeaderBag;
  cookies?: Record<string, string | undefined>;
  user?: unknown;
  squarePrincipal?: VerifiedPrincipal;
  squareClaims?: VerifiedPrincipal["claims"];
};

export type NodeResponseLike = {
  statusCode: number;
  setHeader(name: string, value: string | string[]): void;
  end(body?: string): void;
};

export type NodeNext = (error?: unknown) => void;

export type ExpressRequestLike = NodeRequestLike & {
  header?(name: string): string | undefined;
};

export type ExpressResponseLike = NodeResponseLike & {
  status?(statusCode: number): ExpressResponseLike;
  json?(body: unknown): void;
};

export type ExpressNext = NodeNext;

export type NestExecutionContextLike = {
  switchToHttp(): {
    getRequest<T = NodeRequestLike>(): T;
  };
};

export type NodeEnvLike = Record<string, string | undefined>;

export type NodeSquareAuthOptions = VerifyAccessTokenOptions & {
  attach?: boolean;
  attachUser?: boolean;
  cookieName?: string;
  errorBody?: boolean;
};

export type NodeSquareAuth = ReturnType<typeof createNodeSquareAuth>;

export function squareConfigFromNodeEnv(
  env: NodeEnvLike = process.env,
  overrides: Partial<SquareIdPConfig> = {},
): SquareIdPConfig {
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

export function readHeader(headers: HeaderBag | undefined, name: string): string | null {
  if (!headers) return null;

  const getter = typeof headers.get === "function" ? headers.get.bind(headers) : undefined;
  const fromGetter = getter?.(name) ?? getter?.(name.toLowerCase()) ?? getter?.(name.toUpperCase());
  if (fromGetter) return fromGetter;

  const record = headers as Record<string, string | string[] | undefined>;
  const raw = record[name] ?? record[name.toLowerCase()] ?? record[canonicalHeaderName(name)];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

export function bearerTokenFromHeaders(headers: HeaderBag): string | null {
  const value = readHeader(headers, "authorization");
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function bearerTokenFromRequest(request: NodeRequestLike, options: Pick<NodeSquareAuthOptions, "cookieName"> = {}): string | null {
  const headerToken = bearerTokenFromHeaders(request.headers);
  if (headerToken) return headerToken;

  if (!options.cookieName) return null;
  const directCookie = request.cookies?.[options.cookieName];
  if (directCookie) return directCookie;

  const cookieHeader = readHeader(request.headers, "cookie");
  if (!cookieHeader) return null;
  return parseCookie(cookieHeader)[options.cookieName] ?? null;
}

export function createNodeSquareAuth(configOrClient: SquareIdPConfig | SquareIdPServerClient) {
  const client = configOrClient instanceof SquareIdPServerClient ? configOrClient : new SquareIdPServerClient(configOrClient);

  return {
    client,
    async verifyRequest(request: NodeRequestLike, options: NodeSquareAuthOptions = {}): Promise<VerifiedPrincipal> {
      const token = bearerTokenFromRequest(request, options);
      if (!token) {
        throw idpError("missing_bearer_token", "missing bearer token");
      }

      const principal = await client.verifyAccessToken(token, options);
      if (options.attach !== false) {
        request.squarePrincipal = principal;
        request.squareClaims = principal.claims;
        if (options.attachUser) request.user = principal;
      }
      return principal;
    },
    requireAuth(options: NodeSquareAuthOptions = {}) {
      return async (request: NodeRequestLike, response: NodeResponseLike, next: NodeNext) => {
        try {
          await this.verifyRequest(request, options);
          next();
        } catch (error) {
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

export function createExpressMiddleware(configOrClient: SquareIdPConfig | SquareIdPServerClient, options: NodeSquareAuthOptions = {}) {
  const auth = createNodeSquareAuth(configOrClient);
  return async (request: ExpressRequestLike, response: ExpressResponseLike, next: ExpressNext) => {
    try {
      await auth.verifyRequest(request, options);
      next();
    } catch (error) {
      if (options.errorBody === false) {
        next(error);
        return;
      }
      writeAuthError(response, error);
    }
  };
}

export function createNestSquareGuard(configOrClient: SquareIdPConfig | SquareIdPServerClient, options: NodeSquareAuthOptions = {}) {
  const auth = createNodeSquareAuth(configOrClient);
  return class SquareIdPNestGuard {
    async canActivate(context: NestExecutionContextLike): Promise<boolean> {
      const request = context.switchToHttp().getRequest<NodeRequestLike>();
      await auth.verifyRequest(request, options);
      return true;
    }
  };
}

function writeAuthError(response: NodeResponseLike | ExpressResponseLike, error: unknown): void {
  const code = error instanceof SquareIdPError ? error.code : "unauthorized";
  const statusCode = code === "insufficient_scope" ? 403 : 401;
  const body = { error: code, error_description: error instanceof Error ? error.message : "unauthorized" };

  response.setHeader("WWW-Authenticate", `Bearer error="${code}"`);
  response.setHeader("Content-Type", "application/json");

  const maybeExpress = response as ExpressResponseLike;
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

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function requiredEnv(env: NodeEnvLike, name: string, override?: string): string {
  const value = override ?? env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function canonicalHeaderName(name: string): string {
  return name
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
    .join("-");
}
