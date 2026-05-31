import { BaseIdPServerClient } from "./server.js";
import type { BaseIdPConfig, TokenPair, VerifiedPrincipal } from "./types.js";
export type SvelteKitEventLike = {
    url: URL;
    request: Request;
};
export type SvelteCallbackResult = {
    tokens: TokenPair;
    principal: VerifiedPrincipal;
    state?: string;
};
export declare function createSvelteKitBaseIdpAuth(config: BaseIdPConfig): {
    client: BaseIdPServerClient;
    loginLocation(event: SvelteKitEventLike, defaultReturnTo?: string): string;
    callback(event: SvelteKitEventLike, codeVerifier?: string): Promise<SvelteCallbackResult>;
};
//# sourceMappingURL=sveltekit.d.ts.map