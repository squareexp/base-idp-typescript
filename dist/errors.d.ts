export declare class BaseIdPError extends Error {
    readonly code: string;
    readonly status?: number;
    readonly details?: unknown;
    constructor(code: string, message: string, options?: {
        status?: number;
        details?: unknown;
    });
}
export declare function idpError(code: string, message: string, status?: number, details?: unknown): BaseIdPError;
export { BaseIdPError as BaseIdpError };
//# sourceMappingURL=errors.d.ts.map