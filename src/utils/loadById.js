const HttpError = require('./HttpError');

// Returns an Express param handler: router.param('id', loadById(collection, 'Car')).
// It validates :id, looks the item up and stores it on req.item, or responds 404.
function loadById(collection, label) {
  return (req, res, next, rawId) => {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) return next(new HttpError(400, `'${rawId}' is not a valid id`));
    const item = collection.get(id);
    if (!item) return next(new HttpError(404, `${label} ${id} not found`));
    req.item = item;
    next();
  };
}

module.exports = loadById;
