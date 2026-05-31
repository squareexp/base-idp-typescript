import { BaseIdPClient } from "./client.js";
import { verifyPasetoV4Public } from "./paseto.js";
import type { BaseIdPConfig, ResolvedConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";

export class BaseIdPServerClient extends BaseIdPClient {
  private initialized = false;

  constructor(private readonly serverConfig: BaseIdPConfig) {
    super(serverConfig);
  }

  async init(): Promise<ResolvedConfig> {
    if (this.initialized) return this.cfg;
    const resolved = await this.resolveConfig();
    this.initialized = true;
    return resolved;
  }

  async verifyAccessToken(token: string, options: VerifyAccessTokenOptions = {}): Promise<VerifiedPrincipal> {
    await this.init();
    const keySet = await this.publicKeys();
    return verifyPasetoV4Public(token, keySet, this.cfg, options);
  }
}

export { BaseIdPServerClient as BaseIdpServerClient };

export { verifyPasetoV4Public, unsafeFooter, unsafeFooterKid } from "./paseto.js";
export type { VerifiedPrincipal, VerifyAccessTokenOptions, AccessClaims } from "./types.js";
