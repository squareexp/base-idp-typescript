import { SquareIdPServerClient } from "./server.js";
import type { SquareIdPConfig, TokenPair, VerifiedPrincipal } from "./types.js";

export type SvelteKitEventLike = {
  url: URL;
  request: Request;
};

export type SvelteCallbackResult = {
  tokens: TokenPair;
  principal: VerifiedPrincipal;
  state?: string;
};

export function createSvelteKitSquareAuth(config: SquareIdPConfig) {
  const client = new SquareIdPServerClient(config);
  return {
    client,
    loginLocation(event: SvelteKitEventLike, defaultReturnTo = "/"): string {
      const returnTo = event.url.searchParams.get("return_to") ?? defaultReturnTo;
      return client.authorizeUrl({ state: returnTo });
    },
    async callback(event: SvelteKitEventLike, codeVerifier?: string): Promise<SvelteCallbackResult> {
      const code = event.url.searchParams.get("code");
      if (!code) {
        throw new Error("missing OAuth authorization code");
      }
      const state = event.url.searchParams.get("state") ?? undefined;
      const tokens = await client.exchangeCode({ code, codeVerifier });
      const principal = await client.verifyAccessToken(tokens.access_token);
      return { tokens, principal, state };
    },
  };
}
