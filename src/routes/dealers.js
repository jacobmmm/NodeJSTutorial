const express = require('express');
const store = require('../data/store');
const HttpError = require('../utils/HttpError');
const loadById = require('../utils/loadById');
const { validate } = require('../utils/validate');
const { dealerSchema, presentDealer } = require('../models/dealer');
const { listCars } = require('../services/carQuery');

const router = express.Router();
router.param('id', loadById(store.dealers, 'Dealer'));

function assertManufacturersExist(manufacturerIds = []) {
  const missing = manufacturerIds.filter((id) => !store.manufacturers.get(id));
  if (missing.length > 0) throw new HttpError(422, `Unknown manufacturer id(s): ${missing.join(', ')}`);
}

// GET /api/dealers?location=Ringwood&manufacturerId=8
router.get('/', (req, res) => {
  let data = store.dealers.all();
  if (req.query.location) data = data.filter((d) => d.location === req.query.location);
  if (req.query.manufacturerId) {
    data = data.filter((d) => d.manufacturerIds.includes(Number(req.query.manufacturerId)));
  }
  res.json({ data: data.map(presentDealer) });
});

router.get('/:id', (req, res) => {
  res.json(presentDealer(req.item));
});

// GET /api/dealers/:id/cars - one dealer's stock (same filters as /api/cars)
router.get('/:id/cars', (req, res) => {
  res.json(listCars(req.query, { dealerId: req.item.id }));
});

router.post('/', (req, res) => {
  const data = validate(dealerSchema, req.body);
  assertManufacturersExist(data.manufacturerIds);
  const dealer = store.dealers.insert(data);
  res.status(201).location(`/api/dealers/${dealer.id}`).json(presentDealer(dealer));
});

router.put('/:id', (req, res) => {
  const data = validate(dealerSchema, req.body);
  assertManufacturersExist(data.manufacturerIds);
  res.json(presentDealer(store.dealers.update(req.item.id, data, { replace: true })));
});

router.patch('/:id', (req, res) => {
  const data = validate(dealerSchema, req.body, { partial: true });
  assertManufacturersExist(data.manufacturerIds);
  res.json(presentDealer(store.dealers.update(req.item.id, data)));
});

router.delete('/:id', (req, res) => {
  const carCount = store.cars.all().filter((car) => car.dealerId === req.item.id).length;
  if (carCount > 0) {
    throw new HttpError(409, `Cannot delete dealer ${req.item.id}: it still has ${carCount} car(s) in stock`);
  }
  store.dealers.remove(req.item.id);
  res.status(204).end();
});

module.exports = router;
