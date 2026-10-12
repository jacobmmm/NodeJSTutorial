const CURRENT_YEAR = new Date().getFullYear();

// An automobile manufacturer / brand, e.g. Toyota, BMW.
const manufacturerSchema = {
  name: { type: 'string', required: true, maxLength: 50 },
  country: { type: 'string', required: true, maxLength: 50 },
  foundedYear: { type: 'integer', min: 1850, max: CURRENT_YEAR },
  prestige: { type: 'boolean', default: false },
  website: { type: 'string', pattern: /^https?:\/\/\S+$/ },
};

module.exports = { manufacturerSchema };
