export class BaseIdPError extends Error {
    code;
    status;
    details;
    constructor(code, message, options = {}) {
        super(message);
        this.name = "BaseIdPError";
        this.code = code;
        this.status = options.status;
        this.details = options.details;
    }
}
export function idpError(code, message, status, details) {
    return new BaseIdPError(code, message, { status, details });
}
export { BaseIdPError as BaseIdpError };
//# sourceMappingURL=errors.js.map