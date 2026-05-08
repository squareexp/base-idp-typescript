import { SquareIdPClient } from "./client.js";
import type { SquareIdPConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";
export declare class SquareIdPServerClient extends SquareIdPClient {
    private readonly serverConfig;
    constructor(serverConfig: SquareIdPConfig);
    verifyAccessToken(token: string, options?: VerifyAccessTokenOptions): Promise<VerifiedPrincipal>;
}
export { verifyPasetoV4Public, unsafeFooter, unsafeFooterKid } from "./paseto.js";
export type { VerifiedPrincipal, VerifyAccessTokenOptions, AccessClaims } from "./types.js";
//# sourceMappingURL=server.d.ts.map