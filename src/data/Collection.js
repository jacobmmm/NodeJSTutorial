// A minimal in-memory "table". Swap this for a real database later
// (e.g. SQLite, Postgres, MongoDB) without changing the routes much.
class Collection {
  constructor() {
    this.clear();
  }

  clear() {
    this.items = new Map();
    this.nextId = 1;
  }

  all() {
    return [...this.items.values()];
  }

  get(id) {
    return this.items.get(id);
  }

  insert(data) {
    const now = new Date().toISOString();
    const item = { id: this.nextId++, ...data, createdAt: now, updatedAt: now };
    this.items.set(item.id, item);
    return item;
  }

  // replace = true  -> PUT semantics (fields not supplied are dropped)
  // replace = false -> PATCH semantics (fields are merged)
  update(id, data, { replace = false } = {}) {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const base = replace ? {} : existing;
    const item = { ...base, ...data, id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() };
    this.items.set(id, item);
    return item;
  }

  remove(id) {
    return this.items.delete(id);
  }
}

module.exports = Collection;
