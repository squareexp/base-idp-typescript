export class SquareIdPError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(code: string, message: string, options: { status?: number; details?: unknown } = {}) {
    super(message);
    this.name = "SquareIdPError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
  }
}

export function idpError(code: string, message: string, status?: number, details?: unknown): SquareIdPError {
  return new SquareIdPError(code, message, { status, details });
}
