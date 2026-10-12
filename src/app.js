const express = require('express');
const HttpError = require('./utils/HttpError');

const app = express();

// Parse JSON request bodies into req.body
app.use(express.json());

// Simple request logger (silenced while running tests)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`));
    next();
  });
}

// API index: lets a client discover the available resources
app.get('/api', (req, res) => {
  res.json({
    name: 'Car City API',
    resources: {
      cars: '/api/cars',
      dealers: '/api/dealers',
      manufacturers: '/api/manufacturers',
    },
  });
});

app.use('/api/cars', require('./routes/cars'));
app.use('/api/dealers', require('./routes/dealers'));
app.use('/api/manufacturers', require('./routes/manufacturers'));

// Anything not matched above
app.use((req, res, next) => {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

// Central error handler: every error becomes a consistent JSON response.
// Express recognises error handlers by their four arguments.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Malformed JSON in request body');
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      status,
      message: status >= 500 ? 'Internal server error' : err.message,
      ...(err.details && { details: err.details }),
    },
  });
});

module.exports = app;
