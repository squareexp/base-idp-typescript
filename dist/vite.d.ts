import type { ReactBaseIdpAuth } from "./react.js";
import type { BaseIdPConfig } from "./types.js";
export type ViteBaseIdpEnv = Record<string, string | boolean | undefined>;
export declare function baseIdpConfigFromViteEnv(env: ViteBaseIdpEnv, overrides?: Partial<BaseIdPConfig>): BaseIdPConfig;
export declare function createViteBaseIdpAuth(env: ViteBaseIdpEnv, overrides?: Partial<BaseIdPConfig>): ReactBaseIdpAuth;
//# sourceMappingURL=vite.d.ts.map