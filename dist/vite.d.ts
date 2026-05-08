import type { ReactSquareAuth } from "./react.js";
import type { SquareIdPConfig } from "./types.js";
export type ViteSquareEnv = Record<string, string | boolean | undefined>;
export declare function squareConfigFromViteEnv(env: ViteSquareEnv, overrides?: Partial<SquareIdPConfig>): SquareIdPConfig;
export declare function createViteSquareAuth(env: ViteSquareEnv, overrides?: Partial<SquareIdPConfig>): ReactSquareAuth;
//# sourceMappingURL=vite.d.ts.map