const Collection = require('./Collection');

const manufacturers = new Collection();
const dealers = new Collection();
const cars = new Collection();

// Restores the sample data. Called on startup and before each test.
function reset() {
  manufacturers.clear();
  dealers.clear();
  cars.clear();

  const m = {};
  for (const [name, country, foundedYear, prestige] of [
    ['Toyota', 'Japan', 1937, false],
    ['Mazda', 'Japan', 1920, false],
    ['Hyundai', 'South Korea', 1967, false],
    ['Ford', 'United States', 1903, false],
    ['Volkswagen', 'Germany', 1937, false],
    ['Subaru', 'Japan', 1953, false],
    ['Mitsubishi', 'Japan', 1970, false],
    ['BMW', 'Germany', 1916, true],
    ['Audi', 'Germany', 1909, true],
    ['Mercedes-Benz', 'Germany', 1926, true],
  ]) {
    m[name] = manufacturers.insert({ name, country, foundedYear, prestige }).id;
  }

  // Dealer names are made up; the site layout (Ringwood / Minchinbury) mirrors Car City.
  const d = {
    eastside: dealers.insert({
      name: 'Eastside Motors',
      location: 'Ringwood',
      phone: '03 9000 0001',
      email: 'sales@eastsidemotors.example',
      manufacturerIds: [m.Toyota, m.Mazda, m.Subaru],
      tradingHours: 'Mon-Sat 9am-6pm, Sun 10am-5pm',
    }).id,
    prestige: dealers.insert({
      name: 'Maroondah Prestige',
      location: 'Ringwood',
      phone: '03 9000 0002',
      email: 'hello@maroondahprestige.example',
      manufacturerIds: [m.BMW, m.Audi, m['Mercedes-Benz']],
      tradingHours: 'Mon-Sat 9am-6pm',
    }).id,
    western: dealers.insert({
      name: 'Western Sydney Cars',
      location: 'Minchinbury',
      phone: '02 9000 0003',
      email: 'sales@westernsydneycars.example',
      manufacturerIds: [m.Hyundai, m.Ford, m.Mitsubishi],
      tradingHours: 'Mon-Sun 9am-5pm',
    }).id,
    m4: dealers.insert({
      name: 'M4 Motor Co',
      location: 'Minchinbury',
      phone: '02 9000 0004',
      email: 'enquiries@m4motorco.example',
      manufacturerIds: [m.Volkswagen],
      tradingHours: 'Mon-Sat 9am-6pm',
    }).id,
  };

  const car = (data) => cars.insert({ kilometres: 0, status: 'available', ...data });
  car({ manufacturerId: m.Toyota, dealerId: d.eastside, model: 'RAV4', variant: 'GX Hybrid', year: 2025, price: 42990, condition: 'new', bodyType: 'SUV', transmission: 'Automatic', fuelType: 'Hybrid', colour: 'White' });
  car({ manufacturerId: m.Mazda, dealerId: d.eastside, model: 'CX-5', variant: 'Maxx Sport', year: 2021, price: 31500, kilometres: 48210, condition: 'used', bodyType: 'SUV', transmission: 'Automatic', fuelType: 'Petrol', colour: 'Soul Red' });
  car({ manufacturerId: m.Ford, dealerId: d.eastside, model: 'Ranger', variant: 'XLT', year: 2019, price: 38900, kilometres: 91000, condition: 'used', bodyType: 'Ute', transmission: 'Automatic', fuelType: 'Diesel', colour: 'Grey' });
  car({ manufacturerId: m.BMW, dealerId: d.prestige, model: '330i', variant: 'M Sport', year: 2024, price: 79900, kilometres: 5200, condition: 'demo', bodyType: 'Sedan', transmission: 'Automatic', fuelType: 'Petrol', colour: 'Black' });
  car({ manufacturerId: m['Mercedes-Benz'], dealerId: d.prestige, model: 'C300', year: 2020, price: 54990, kilometres: 62000, condition: 'used', bodyType: 'Sedan', transmission: 'Automatic', fuelType: 'Petrol', colour: 'Silver' });
  car({ manufacturerId: m.Hyundai, dealerId: d.western, model: 'i30', variant: 'N Line', year: 2025, price: 33490, condition: 'new', bodyType: 'Hatchback', transmission: 'Manual', fuelType: 'Petrol', colour: 'Blue' });
  car({ manufacturerId: m.Mitsubishi, dealerId: d.western, model: 'Triton', variant: 'GLX+', year: 2018, price: 24990, kilometres: 120500, condition: 'used', bodyType: 'Ute', transmission: 'Manual', fuelType: 'Diesel', colour: 'White', status: 'sold' });
  car({ manufacturerId: m.Volkswagen, dealerId: d.m4, model: 'ID.4', variant: 'Pro', year: 2025, price: 64990, condition: 'new', bodyType: 'SUV', transmission: 'Automatic', fuelType: 'Electric', colour: 'Grey' });
}

reset();

module.exports = { manufacturers, dealers, cars, reset };
