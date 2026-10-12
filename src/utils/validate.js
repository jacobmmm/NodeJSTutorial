const HttpError = require('./HttpError');

// A tiny schema validator (in a real project you'd likely reach for zod or joi).
//
// Each schema field supports:
//   type:      'string' | 'integer' | 'number' | 'boolean' | 'integerArray'
//   required:  must be present when creating / replacing (POST, PUT)
//   default:   value used when the field is omitted on POST / PUT
//   enum:      list of allowed values
//   min / max: numeric bounds
//   maxLength: string length limit
//   pattern:   RegExp a string must match
//
// partial = true is used for PATCH: only the supplied fields are checked.
function validate(schema, input, { partial = false } = {}) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }

  const errors = [];
  const output = {};

  for (const key of Object.keys(input)) {
    if (!(key in schema)) errors.push(`Unknown field '${key}'`);
  }

  for (const [key, rule] of Object.entries(schema)) {
    const value = input[key];

    if (value === undefined) {
      if (partial) continue;
      if (rule.required) errors.push(`'${key}' is required`);
      else if (rule.default !== undefined) output[key] = structuredClone(rule.default);
      continue;
    }

    const error = checkField(key, value, rule);
    if (error) errors.push(error);
    else output[key] = typeof value === 'string' ? value.trim() : value;
  }

  if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors);
  return output;
}

function checkField(key, value, rule) {
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string' || value.trim() === '') return `'${key}' must be a non-empty string`;
      if (rule.maxLength && value.length > rule.maxLength) return `'${key}' must be at most ${rule.maxLength} characters`;
      if (rule.pattern && !rule.pattern.test(value)) return `'${key}' has an invalid format`;
      break;
    case 'integer':
      if (!Number.isInteger(value)) return `'${key}' must be an integer`;
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return `'${key}' must be a number`;
      break;
    case 'boolean':
      if (typeof value !== 'boolean') return `'${key}' must be true or false`;
      break;
    case 'integerArray':
      if (!Array.isArray(value) || !value.every(Number.isInteger)) return `'${key}' must be an array of integers`;
      break;
  }

  if (rule.enum && !rule.enum.includes(value)) return `'${key}' must be one of: ${rule.enum.join(', ')}`;
  if (rule.min !== undefined && value < rule.min) return `'${key}' must be >= ${rule.min}`;
  if (rule.max !== undefined && value > rule.max) return `'${key}' must be <= ${rule.max}`;
  return null;
}

// Parses an optional numeric query-string value, e.g. ?minPrice=10000
function parseQueryNumber(query, key, { integer = false, min } = {}) {
  const raw = query[key];
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || (min !== undefined && value < min)) {
    throw new HttpError(400, `Query parameter '${key}' is invalid`);
  }
  return value;
}

module.exports = { validate, parseQueryNumber };
