const store = require('../data/store');
const HttpError = require('../utils/HttpError');
const { parseQueryNumber } = require('../utils/validate');
const { SORTABLE_FIELDS } = require('../models/car');
const { presentDealer } = require('../models/dealer');

// ?expand=manufacturer,dealer embeds the related objects instead of just their ids.
function parseExpand(query) {
  const expand = new Set(query.expand ? String(query.expand).split(',') : []);
  for (const value of expand) {
    if (!['manufacturer', 'dealer'].includes(value)) {
      throw new HttpError(400, `Cannot expand '${value}'. Allowed: manufacturer, dealer`);
    }
  }
  return expand;
}

function presentCar(car, expand) {
  const result = { ...car };
  if (expand.has('manufacturer')) result.manufacturer = store.manufacturers.get(car.manufacturerId);
  if (expand.has('dealer')) result.dealer = presentDealer(store.dealers.get(car.dealerId));
  return result;
}

// Supports filtering, free-text search, sorting and pagination, e.g.
//   /api/cars?condition=used&maxPrice=40000&sort=-year&page=1&limit=5
// fixedFilter is used by nested routes such as /api/dealers/:id/cars.
function listCars(query, fixedFilter = {}) {
  const filter = {
    manufacturerId: parseQueryNumber(query, 'manufacturerId', { integer: true }),
    dealerId: parseQueryNumber(query, 'dealerId', { integer: true }),
    ...fixedFilter,
  };
  const minPrice = parseQueryNumber(query, 'minPrice', { min: 0 });
  const maxPrice = parseQueryNumber(query, 'maxPrice', { min: 0 });
  const minYear = parseQueryNumber(query, 'minYear', { integer: true });
  const maxYear = parseQueryNumber(query, 'maxYear', { integer: true });
  const maxKilometres = parseQueryNumber(query, 'maxKilometres', { integer: true, min: 0 });
  const page = parseQueryNumber(query, 'page', { integer: true, min: 1 }) ?? 1;
  const limit = Math.min(parseQueryNumber(query, 'limit', { integer: true, min: 1 }) ?? 10, 100);
  const search = query.q ? String(query.q).toLowerCase() : undefined;
  const expand = parseExpand(query);

  let results = store.cars.all().filter((car) =>
    (filter.manufacturerId === undefined || car.manufacturerId === filter.manufacturerId) &&
    (filter.dealerId === undefined || car.dealerId === filter.dealerId) &&
    (!query.condition || car.condition === query.condition) &&
    (!query.bodyType || car.bodyType === query.bodyType) &&
    (!query.fuelType || car.fuelType === query.fuelType) &&
    (!query.transmission || car.transmission === query.transmission) &&
    (!query.status || car.status === query.status) &&
    (minPrice === undefined || car.price >= minPrice) &&
    (maxPrice === undefined || car.price <= maxPrice) &&
    (minYear === undefined || car.year >= minYear) &&
    (maxYear === undefined || car.year <= maxYear) &&
    (maxKilometres === undefined || car.kilometres <= maxKilometres) &&
    (!search || `${car.model} ${car.variant ?? ''}`.toLowerCase().includes(search)),
  );

  if (query.location) {
    results = results.filter((car) => store.dealers.get(car.dealerId).location === query.location);
  }

  if (query.sort) {
    const sort = String(query.sort);
    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    if (!SORTABLE_FIELDS.includes(field)) {
      throw new HttpError(400, `Cannot sort by '${field}'. Allowed: ${SORTABLE_FIELDS.join(', ')}`);
    }
    results.sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * (descending ? -1 : 1));
  }

  const total = results.length;
  const data = results.slice((page - 1) * limit, page * limit).map((car) => presentCar(car, expand));
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { listCars, presentCar, parseExpand };
