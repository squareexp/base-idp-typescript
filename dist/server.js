import { BaseIdPClient } from "./client.js";
import { verifyPasetoV4Public } from "./paseto.js";
export class BaseIdPServerClient extends BaseIdPClient {
    serverConfig;
    initialized = false;
    constructor(serverConfig) {
        super(serverConfig);
        this.serverConfig = serverConfig;
    }
    async init() {
        if (this.initialized)
            return this.cfg;
        const resolved = await this.resolveConfig();
        this.initialized = true;
        return resolved;
    }
    async verifyAccessToken(token, options = {}) {
        await this.init();
        const keySet = await this.publicKeys();
        return verifyPasetoV4Public(token, keySet, this.cfg, options);
    }
}
export { BaseIdPServerClient as BaseIdpServerClient };
export { verifyPasetoV4Public, unsafeFooter, unsafeFooterKid } from "./paseto.js";
//# sourceMappingURL=server.js.map