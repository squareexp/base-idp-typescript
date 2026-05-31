import { BaseIdPClient } from "./client.js";
import type { BaseIdPConfig, ResolvedConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";
export declare class BaseIdPServerClient extends BaseIdPClient {
    private readonly serverConfig;
    private initialized;
    constructor(serverConfig: BaseIdPConfig);
    init(): Promise<ResolvedConfig>;
    verifyAccessToken(token: string, options?: VerifyAccessTokenOptions): Promise<VerifiedPrincipal>;
}
export { BaseIdPServerClient as BaseIdpServerClient };
export { verifyPasetoV4Public, unsafeFooter, unsafeFooterKid } from "./paseto.js";
export type { VerifiedPrincipal, VerifyAccessTokenOptions, AccessClaims } from "./types.js";
//# sourceMappingURL=server.d.ts.map