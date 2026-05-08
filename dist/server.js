import { SquareIdPClient } from "./client.js";
import { verifyPasetoV4Public } from "./paseto.js";
export class SquareIdPServerClient extends SquareIdPClient {
    serverConfig;
    constructor(serverConfig) {
        super(serverConfig);
        this.serverConfig = serverConfig;
    }
    async verifyAccessToken(token, options = {}) {
        const keySet = await this.publicKeys();
        return verifyPasetoV4Public(token, keySet, this.serverConfig, options);
    }
}
export { verifyPasetoV4Public, unsafeFooter, unsafeFooterKid } from "./paseto.js";
//# sourceMappingURL=server.js.map