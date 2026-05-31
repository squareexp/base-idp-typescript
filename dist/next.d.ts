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
export declare function createNextBaseIdpAuth(config: BaseIdPConfig, options?: NextBaseIdpAuthOptions): {
    client: BaseIdPServerClient;
    login(request: Request): Response;
    callback(request: Request): Promise<Response>;
};
//# sourceMappingURL=next.d.ts.map