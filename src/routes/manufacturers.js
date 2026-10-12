const express = require('express');
const store = require('../data/store');
const HttpError = require('../utils/HttpError');
const loadById = require('../utils/loadById');
const { validate } = require('../utils/validate');
const { manufacturerSchema } = require('../models/manufacturer');
const { listCars } = require('../services/carQuery');

const router = express.Router();
router.param('id', loadById(store.manufacturers, 'Manufacturer'));

function assertUniqueName(name, ignoreId) {
  const clash = store.manufacturers.all().find(
    (m) => m.id !== ignoreId && m.name.toLowerCase() === name.toLowerCase(),
  );
  if (clash) throw new HttpError(409, `Manufacturer '${name}' already exists (id ${clash.id})`);
}

// GET /api/manufacturers?country=Japan&prestige=true
router.get('/', (req, res) => {
  let data = store.manufacturers.all();
  if (req.query.country) data = data.filter((m) => m.country.toLowerCase() === req.query.country.toLowerCase());
  if (req.query.prestige !== undefined) data = data.filter((m) => String(m.prestige) === req.query.prestige);
  res.json({ data });
});

router.get('/:id', (req, res) => {
  res.json(req.item);
});

// GET /api/manufacturers/:id/cars - all stock for one brand (same filters as /api/cars)
router.get('/:id/cars', (req, res) => {
  res.json(listCars(req.query, { manufacturerId: req.item.id }));
});

router.post('/', (req, res) => {
  const data = validate(manufacturerSchema, req.body);
  assertUniqueName(data.name);
  const manufacturer = store.manufacturers.insert(data);
  res.status(201).location(`/api/manufacturers/${manufacturer.id}`).json(manufacturer);
});

router.put('/:id', (req, res) => {
  const data = validate(manufacturerSchema, req.body);
  assertUniqueName(data.name, req.item.id);
  res.json(store.manufacturers.update(req.item.id, data, { replace: true }));
});

router.patch('/:id', (req, res) => {
  const data = validate(manufacturerSchema, req.body, { partial: true });
  if (data.name) assertUniqueName(data.name, req.item.id);
  res.json(store.manufacturers.update(req.item.id, data));
});

router.delete('/:id', (req, res) => {
  const id = req.item.id;
  const carCount = store.cars.all().filter((car) => car.manufacturerId === id).length;
  if (carCount > 0) {
    throw new HttpError(409, `Cannot delete manufacturer ${id}: ${carCount} car(s) still reference it`);
  }
  // Dealers can no longer be authorised for a brand that doesn't exist.
  for (const dealer of store.dealers.all()) {
    if (dealer.manufacturerIds.includes(id)) {
      store.dealers.update(dealer.id, { manufacturerIds: dealer.manufacturerIds.filter((mId) => mId !== id) });
    }
  }
  store.manufacturers.remove(id);
  res.status(204).end();
});

module.exports = router;
