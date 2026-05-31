import { BaseIdPServerClient } from "./server.js";
import type { BaseIdPConfig, TokenPair, VerifiedPrincipal } from "./types.js";

export type NextCallbackContext = {
  request: Request;
  tokens: TokenPair;
  principal: VerifiedPrincipal;
  state?: string;
};

export type NextBaseIdpAuthOptions = {
  defaultReturnTo?: string;
  resolveCodeVerifier?: (request: Request, state?: string) => string | Promise<string | undefined> | undefined;
  onCallback?: (context: NextCallbackContext) => Response | Promise<Response>;
};

export function createNextBaseIdpAuth(config: BaseIdPConfig, options: NextBaseIdpAuthOptions = {}) {
  const client = new BaseIdPServerClient(config);
  return {
    client,
    login(request: Request): Response {
      const requestURL = new URL(request.url);
      const returnTo = requestURL.searchParams.get("return_to") ?? options.defaultReturnTo;
      const location = client.authorizeUrl({ state: returnTo ?? undefined });
      return Response.redirect(location, 302);
    },
    async callback(request: Request): Promise<Response> {
      const requestURL = new URL(request.url);
      const code = requestURL.searchParams.get("code");
      const state = requestURL.searchParams.get("state") ?? undefined;
      if (!code) {
        return Response.json({ error: "missing_code" }, { status: 400 });
      }
      const codeVerifier = await options.resolveCodeVerifier?.(request, state);
      const tokens = await client.exchangeCode({ code, codeVerifier });
      const principal = await client.verifyAccessToken(tokens.access_token);
      const context = { request, tokens, principal, state };
      if (options.onCallback) {
        return options.onCallback(context);
      }
      return Response.json({
        ok: true,
        principal: {
          id: principal.id,
          email: principal.email,
          role: principal.role,
          scopes: principal.scopes,
        },
        state,
      });
    },
  };
}
