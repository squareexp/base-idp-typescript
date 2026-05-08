import { SquareIdPServerClient } from "./server.js";
import type { AccessClaims, SquareIdPConfig, TokenPair, VerifiedPrincipal } from "./types.js";
export type NextCallbackContext = {
    request: Request;
    tokens: TokenPair;
    principal: VerifiedPrincipal;
    claims: AccessClaims;
    state?: string;
};
export type NextSquareAuthOptions = {
    defaultReturnTo?: string;
    resolveCodeVerifier?: (request: Request, state?: string) => string | Promise<string | undefined> | undefined;
    onCallback?: (context: NextCallbackContext) => Response | Promise<Response>;
};
export declare function createNextSquareAuth(config: SquareIdPConfig, options?: NextSquareAuthOptions): {
    client: SquareIdPServerClient;
    login(request: Request): Response;
    callback(request: Request): Promise<Response>;
};
//# sourceMappingURL=next.d.ts.map