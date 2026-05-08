import { SquareIdPServerClient } from "./server.js";
import type { SquareIdPConfig, VerifiedPrincipal, VerifyAccessTokenOptions } from "./types.js";
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
    squarePrincipal?: VerifiedPrincipal;
    squareClaims?: VerifiedPrincipal["claims"];
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
export type NodeSquareAuthOptions = VerifyAccessTokenOptions & {
    attach?: boolean;
    attachUser?: boolean;
    cookieName?: string;
    errorBody?: boolean;
};
export type NodeSquareAuth = ReturnType<typeof createNodeSquareAuth>;
export declare function squareConfigFromNodeEnv(env?: NodeEnvLike, overrides?: Partial<SquareIdPConfig>): SquareIdPConfig;
export declare function readHeader(headers: HeaderBag | undefined, name: string): string | null;
export declare function bearerTokenFromHeaders(headers: HeaderBag): string | null;
export declare function bearerTokenFromRequest(request: NodeRequestLike, options?: Pick<NodeSquareAuthOptions, "cookieName">): string | null;
export declare function createNodeSquareAuth(configOrClient: SquareIdPConfig | SquareIdPServerClient): {
    client: SquareIdPServerClient;
    verifyRequest(request: NodeRequestLike, options?: NodeSquareAuthOptions): Promise<VerifiedPrincipal>;
    requireAuth(options?: NodeSquareAuthOptions): (request: NodeRequestLike, response: NodeResponseLike, next: NodeNext) => Promise<void>;
};
export declare function createExpressMiddleware(configOrClient: SquareIdPConfig | SquareIdPServerClient, options?: NodeSquareAuthOptions): (request: ExpressRequestLike, response: ExpressResponseLike, next: ExpressNext) => Promise<void>;
export declare function createNestSquareGuard(configOrClient: SquareIdPConfig | SquareIdPServerClient, options?: NodeSquareAuthOptions): {
    new (): {
        canActivate(context: NestExecutionContextLike): Promise<boolean>;
    };
};
//# sourceMappingURL=node.d.ts.map