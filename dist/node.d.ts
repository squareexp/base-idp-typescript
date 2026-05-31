import { BaseIdPServerClient } from "./server.js";
import type { BaseIdPConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";
export type HeaderBag = Headers | {
    get?(name: string): string | null | undefined;
    authorization?: string | string[];
    Authorization?: string | string[];
    cookie?: string | string[];
    Cookie?: string | string[];
    [key: string]: string | string[] | ((name: string) => string | null | undefined) | undefined;
};
export type NodeRequestLike = {
    headers: HeaderBag;
    cookies?: Record<string, string | undefined>;
    user?: unknown;
    baseIdpPrincipal?: VerifiedPrincipal;
    baseIdpClaims?: VerifiedPrincipal["claims"];
};
export type NodeResponseLike = {
    statusCode: number;
    setHeader(name: string, value: string | string[]): void;
    end(body?: string): void;
};
export type NodeNext = (error?: unknown) => void;
export type ExpressRequestLike = NodeRequestLike & {
    header?(name: string): string | undefined;
};
export type ExpressResponseLike = NodeResponseLike & {
    status?(statusCode: number): ExpressResponseLike;
    json?(body: unknown): void;
};
export type ExpressNext = NodeNext;
export type NestExecutionContextLike = {
    switchToHttp(): {
        getRequest<T = NodeRequestLike>(): T;
    };
};
export type NodeEnvLike = Record<string, string | undefined>;
export type NodeBaseIdpAuthOptions = VerifyAccessTokenOptions & {
    attach?: boolean;
    attachUser?: boolean;
    cookieName?: string;
    errorBody?: boolean;
};
export type NodeBaseIdpAuth = ReturnType<typeof createNodeBaseIdpAuth>;
export declare function baseIdpConfigFromNodeEnv(env?: NodeEnvLike, overrides?: Partial<BaseIdPConfig>): BaseIdPConfig;
export declare function readHeader(headers: HeaderBag | undefined, name: string): string | null;
export declare function bearerTokenFromHeaders(headers: HeaderBag): string | null;
export declare function bearerTokenFromRequest(request: NodeRequestLike, options?: Pick<NodeBaseIdpAuthOptions, "cookieName">): string | null;
export declare function createNodeBaseIdpAuth(configOrClient: BaseIdPConfig | BaseIdPServerClient): {
    client: BaseIdPServerClient;
    verifyRequest(request: NodeRequestLike, options?: NodeBaseIdpAuthOptions): Promise<VerifiedPrincipal>;
    requireAuth(options?: NodeBaseIdpAuthOptions): (request: NodeRequestLike, response: NodeResponseLike, next: NodeNext) => Promise<void>;
};
export declare function createExpressMiddleware(configOrClient: BaseIdPConfig | BaseIdPServerClient, options?: NodeBaseIdpAuthOptions): (request: ExpressRequestLike, response: ExpressResponseLike, next: ExpressNext) => Promise<void>;
export declare function createNestBaseIdpGuard(configOrClient: BaseIdPConfig | BaseIdPServerClient, options?: NodeBaseIdpAuthOptions): {
    new (): {
        canActivate(context: NestExecutionContextLike): Promise<boolean>;
    };
};
//# sourceMappingURL=node.d.ts.map