import { SquareIdPClient } from "./client.js";
import type { AuthorizeUrlOptions, SquareIdPConfig } from "./types.js";
export type ReactSquareAuth = {
    loginHref(options?: AuthorizeUrlOptions): string;
    login(options?: AuthorizeUrlOptions): void;
    buttonProps(options?: AuthorizeUrlOptions): {
        type: "button";
        onClick(): void;
    };
};
export declare function createReactSquareAuth(config: SquareIdPConfig | SquareIdPClient): ReactSquareAuth;
//# sourceMappingURL=react.d.ts.map