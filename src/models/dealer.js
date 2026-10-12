// Car City has two sites, each home to a number of independent dealers.
const LOCATIONS = {
  Ringwood: { city: 'Melbourne', state: 'VIC' },
  Minchinbury: { city: 'Sydney', state: 'NSW' },
};

// An independent dealer trading at one of the Car City sites.
// manufacturerIds lists the brands the dealer is authorised to sell NEW.
const dealerSchema = {
  name: { type: 'string', required: true, maxLength: 80 },
  location: { type: 'string', required: true, enum: Object.keys(LOCATIONS) },
  phone: { type: 'string', required: true, pattern: /^[0-9 +()-]{8,20}$/ },
  email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  manufacturerIds: { type: 'integerArray', default: [] },
  tradingHours: { type: 'string', maxLength: 100 },
};

// Adds the city / state derived from the location when sending a dealer to a client.
function presentDealer(dealer) {
  return { ...dealer, ...LOCATIONS[dealer.location] };
}

module.exports = { dealerSchema, presentDealer, LOCATIONS };
