export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields?: Record<string, string[]>;

  constructor(opts: {
    code: string;
    message: string;
    status: number;
    fields?: Record<string, string[]>;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.fields = opts.fields;
  }
}
