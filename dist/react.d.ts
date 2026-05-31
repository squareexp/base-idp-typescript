import { BaseIdPClient } from "./client.js";
import type { AuthorizeUrlOptions, BaseIdPConfig } from "./types.js";
export type ReactBaseIdpAuth = {
    loginHref(options?: AuthorizeUrlOptions): string;
    login(options?: AuthorizeUrlOptions): void;
    buttonProps(options?: AuthorizeUrlOptions): {
        type: "button";
        onClick(): void;
    };
};
export declare function createReactBaseIdpAuth(config: BaseIdPConfig | BaseIdPClient): ReactBaseIdpAuth;
//# sourceMappingURL=react.d.ts.map