// An Error that carries an HTTP status code, so route handlers can simply
// `throw new HttpError(404, '...')` and let the error middleware respond.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;
