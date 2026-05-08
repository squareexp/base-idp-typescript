import { SquareIdPClient } from "./client.js";
import { verifyPasetoV4Public } from "./paseto.js";
import type { SquareIdPConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";

export class SquareIdPServerClient extends SquareIdPClient {
  constructor(private readonly serverConfig: SquareIdPConfig) {
    super(serverConfig);
  }

  async verifyAccessToken(token: string, options: VerifyAccessTokenOptions = {}): Promise<VerifiedPrincipal> {
    const keySet = await this.publicKeys();
    return verifyPasetoV4Public(token, keySet, this.serverConfig, options);
  }
}

export { verifyPasetoV4Public, unsafeFooter, unsafeFooterKid } from "./paseto.js";
export type { VerifiedPrincipal, VerifyAccessTokenOptions, AccessClaims } from "./types.js";
