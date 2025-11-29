export class ServerError extends Error {
  statusCode = 400;

  constructor(message: string, statusCode?: number) {
    super(message);

    if (statusCode) {
      this.statusCode = statusCode;
    }
  }

  getErrorMessage() {
    return `Server error: ${this.message}`;
  }
}
