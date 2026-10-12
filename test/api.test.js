process.env.NODE_ENV = 'test';

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const store = require('../src/data/store');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0); // port 0 = pick any free port
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());
beforeEach(() => store.reset());

async function request(method, path, body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

const newCar = {
  manufacturerId: 1, // Toyota
  dealerId: 1, // Eastside Motors (Toyota dealer)
  model: 'Corolla',
  year: 2025,
  price: 31990,
  condition: 'new',
  bodyType: 'Hatchback',
  transmission: 'Automatic',
  fuelType: 'Hybrid',
};

test('GET /api lists resources', async () => {
  const res = await request('GET', '');
  assert.equal(res.status, 200);
  assert.equal(res.body.resources.cars, '/api/cars');
});

test('manufacturers: list, filter, get one, 404', async () => {
  assert.equal((await request('GET', '/manufacturers')).body.data.length, 10);
  const prestige = await request('GET', '/manufacturers?prestige=true');
  assert.deepEqual(prestige.body.data.map((m) => m.name), ['BMW', 'Audi', 'Mercedes-Benz']);
  assert.equal((await request('GET', '/manufacturers/1')).body.name, 'Toyota');
  assert.equal((await request('GET', '/manufacturers/999')).status, 404);
  assert.equal((await request('GET', '/manufacturers/abc')).status, 400);
});

test('manufacturers: create, duplicate name, patch, delete', async () => {
  const created = await request('POST', '/manufacturers', { name: 'Kia', country: 'South Korea', foundedYear: 1944 });
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('location'), `/api/manufacturers/${created.body.id}`);
  assert.equal(created.body.prestige, false); // default applied

  assert.equal((await request('POST', '/manufacturers', { name: 'kia', country: 'Korea' })).status, 409);

  const patched = await request('PATCH', `/manufacturers/${created.body.id}`, { foundedYear: 1945 });
  assert.equal(patched.body.foundedYear, 1945);
  assert.equal(patched.body.name, 'Kia');

  assert.equal((await request('DELETE', `/manufacturers/${created.body.id}`)).status, 204);
  assert.equal((await request('GET', `/manufacturers/${created.body.id}`)).status, 404);
});

test('manufacturers: cannot delete one that still has cars', async () => {
  assert.equal((await request('DELETE', '/manufacturers/1')).status, 409);
});

test('validation errors return 400 with details', async () => {
  const res = await request('POST', '/manufacturers', { country: 5, colour: 'red' });
  assert.equal(res.status, 400);
  assert.ok(res.body.error.details.includes("'name' is required"));
  assert.ok(res.body.error.details.includes("Unknown field 'colour'"));
});

test('malformed JSON returns 400', async () => {
  const res = await fetch(`${baseUrl}/cars`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(res.status, 400);
});

test('dealers: derived city/state, filter by location, unknown brand', async () => {
  const dealer = await request('GET', '/dealers/1');
  assert.equal(dealer.body.city, 'Melbourne');
  assert.equal(dealer.body.state, 'VIC');

  const sydney = await request('GET', '/dealers?location=Minchinbury');
  assert.equal(sydney.body.data.length, 2);

  const bad = await request('POST', '/dealers', {
    name: 'Test Dealer', location: 'Ringwood', phone: '03 9000 9999', email: 'a@b.com', manufacturerIds: [999],
  });
  assert.equal(bad.status, 422);
});

test('dealers: nested cars route', async () => {
  const res = await request('GET', '/dealers/2/cars');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.every((car) => car.dealerId === 2));
});

test('cars: filter, sort and paginate', async () => {
  const used = await request('GET', '/cars?condition=used&sort=-price');
  const prices = used.body.data.map((car) => car.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => b - a));
  assert.ok(used.body.data.every((car) => car.condition === 'used'));

  const page = await request('GET', '/cars?limit=3&page=2');
  assert.equal(page.body.data.length, 3);
  assert.deepEqual(page.body.meta, { page: 2, limit: 3, total: 8, totalPages: 3 });

  const ringwood = await request('GET', '/cars?location=Ringwood');
  assert.equal(ringwood.body.meta.total, 5);

  assert.equal((await request('GET', '/cars?sort=colour')).status, 400);
});

test('cars: expand related objects', async () => {
  const res = await request('GET', '/cars/1?expand=manufacturer,dealer');
  assert.equal(res.body.manufacturer.name, 'Toyota');
  assert.equal(res.body.dealer.name, 'Eastside Motors');
});

test('cars: full CRUD lifecycle', async () => {
  const created = await request('POST', '/cars', newCar);
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'available');
  const id = created.body.id;

  const sold = await request('PATCH', `/cars/${id}`, { status: 'sold' });
  assert.equal(sold.body.status, 'sold');

  const replaced = await request('PUT', `/cars/${id}`, { ...newCar, price: 29990 });
  assert.equal(replaced.body.price, 29990);
  assert.equal(replaced.body.status, 'available'); // PUT replaces the whole resource

  assert.equal((await request('DELETE', `/cars/${id}`)).status, 204);
  assert.equal((await request('GET', `/cars/${id}`)).status, 404);
});

test('cars: business rules return 422', async () => {
  // Eastside Motors isn't a BMW dealer, so it can't sell a new BMW...
  assert.equal((await request('POST', '/cars', { ...newCar, manufacturerId: 8 })).status, 422);
  // ...but it can sell a used one
  assert.equal((await request('POST', '/cars', { ...newCar, manufacturerId: 8, condition: 'used', kilometres: 30000 })).status, 201);
  assert.equal((await request('POST', '/cars', { ...newCar, dealerId: 999 })).status, 422);
  assert.equal((await request('PATCH', '/cars/1', { kilometres: 5000 })).status, 422); // car 1 is new
});

test('unknown route returns 404 JSON', async () => {
  const res = await request('GET', '/trucks');
  assert.equal(res.status, 404);
  assert.match(res.body.error.message, /not found/);
});
