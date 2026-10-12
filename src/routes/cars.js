const express = require('express');
const store = require('../data/store');
const HttpError = require('../utils/HttpError');
const loadById = require('../utils/loadById');
const { validate } = require('../utils/validate');
const { carSchema } = require('../models/car');
const { listCars, presentCar, parseExpand } = require('../services/carQuery');

const router = express.Router();
router.param('id', loadById(store.cars, 'Car'));

// Business rules that need other records. Uses 422 (Unprocessable Content):
// the JSON is well-formed but refers to things that don't make sense.
function assertCarRules(car) {
  const manufacturer = store.manufacturers.get(car.manufacturerId);
  if (!manufacturer) throw new HttpError(422, `Manufacturer ${car.manufacturerId} does not exist`);
  const dealer = store.dealers.get(car.dealerId);
  if (!dealer) throw new HttpError(422, `Dealer ${car.dealerId} does not exist`);
  if (car.condition === 'new' && !dealer.manufacturerIds.includes(car.manufacturerId)) {
    throw new HttpError(422, `${dealer.name} is not an authorised ${manufacturer.name} dealer, so cannot sell it new`);
  }
  if (car.condition === 'new' && car.kilometres > 100) {
    throw new HttpError(422, 'A new car cannot have more than 100 km on the odometer');
  }
}

// GET /api/cars?condition=used&location=Ringwood&maxPrice=40000&sort=-year&page=1&limit=5&expand=dealer
router.get('/', (req, res) => {
  res.json(listCars(req.query));
});

router.get('/:id', (req, res) => {
  res.json(presentCar(req.item, parseExpand(req.query)));
});

router.post('/', (req, res) => {
  const data = validate(carSchema, req.body);
  assertCarRules(data);
  const car = store.cars.insert(data);
  res.status(201).location(`/api/cars/${car.id}`).json(car);
});

router.put('/:id', (req, res) => {
  const data = validate(carSchema, req.body);
  assertCarRules(data);
  res.json(store.cars.update(req.item.id, data, { replace: true }));
});

router.patch('/:id', (req, res) => {
  const data = validate(carSchema, req.body, { partial: true });
  assertCarRules({ ...req.item, ...data });
  res.json(store.cars.update(req.item.id, data));
});

router.delete('/:id', (req, res) => {
  store.cars.remove(req.item.id);
  res.status(204).end();
});

module.exports = router;
