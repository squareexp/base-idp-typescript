export class SquareIdPError extends Error {
    code;
    status;
    details;
    constructor(code, message, options = {}) {
        super(message);
        this.name = "SquareIdPError";
        this.code = code;
        this.status = options.status;
        this.details = options.details;
    }
}
export function idpError(code, message, status, details) {
    return new SquareIdPError(code, message, { status, details });
}
//# sourceMappingURL=errors.js.map