import { BaseIdPClient } from "./client.js";
import type { BaseIdPConfig } from "./types.js";
export declare function createClientBootstrap(config: BaseIdPConfig): {
    client: BaseIdPClient;
    init(): Promise<{
        env: string;
        config: import("./types.js").ResolvedConfig;
    }>;
};
//# sourceMappingURL=bootstrap.d.ts.map