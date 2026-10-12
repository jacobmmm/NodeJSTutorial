const CURRENT_YEAR = new Date().getFullYear();

const CONDITIONS = ['new', 'used', 'demo'];
const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Ute', 'Wagon', 'Coupe', 'Convertible', 'Van'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const STATUSES = ['available', 'sold'];

// A vehicle in stock with a dealer.
const carSchema = {
  manufacturerId: { type: 'integer', required: true },
  dealerId: { type: 'integer', required: true },
  model: { type: 'string', required: true, maxLength: 50 },
  variant: { type: 'string', maxLength: 50 },
  year: { type: 'integer', required: true, min: 1950, max: CURRENT_YEAR + 1 },
  price: { type: 'number', required: true, min: 0 },
  kilometres: { type: 'integer', min: 0, default: 0 },
  condition: { type: 'string', required: true, enum: CONDITIONS },
  bodyType: { type: 'string', required: true, enum: BODY_TYPES },
  transmission: { type: 'string', required: true, enum: TRANSMISSIONS },
  fuelType: { type: 'string', required: true, enum: FUEL_TYPES },
  colour: { type: 'string', maxLength: 30 },
  status: { type: 'string', enum: STATUSES, default: 'available' },
};

// Fields clients may sort the car list by (prefix with '-' for descending).
const SORTABLE_FIELDS = ['price', 'year', 'kilometres', 'createdAt'];

module.exports = { carSchema, SORTABLE_FIELDS };
