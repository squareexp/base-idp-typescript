export class BaseIdPError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(code: string, message: string, options: { status?: number; details?: unknown } = {}) {
    super(message);
    this.name = "BaseIdPError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
  }
}

export function idpError(code: string, message: string, status?: number, details?: unknown): BaseIdPError {
  return new BaseIdPError(code, message, { status, details });
}

export { BaseIdPError as BaseIdpError };
