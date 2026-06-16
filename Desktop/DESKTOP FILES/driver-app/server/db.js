import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dir, 'data.json');

const DEFAULTS = { passengers: [], drivers: [], rides: [] };

function load() {
  if (!existsSync(FILE)) return structuredClone(DEFAULTS);
  try {
    const data = JSON.parse(readFileSync(FILE, 'utf-8'));
    // Reset online status on every server start (stale sockets are gone)
    // Backfill ratingCount for drivers created before this field existed
    data.drivers?.forEach(d => {
      d.isOnline = false;
      d.isAvailable = true;
      if (d.ratingCount === undefined) d.ratingCount = 0;
    });
    return data;
  } catch {
    return structuredClone(DEFAULTS);
  }
}

const store = load();

const TMP = FILE + '.tmp';
function persist() {
  writeFileSync(TMP, JSON.stringify(store, null, 2));
  renameSync(TMP, FILE); // atomic swap — prevents corruption on crash
}

function makeTable(key) {
  return {
    all: () => store[key],
    find: fn => store[key].filter(fn),
    findOne: fn => store[key].find(fn),
    insert(doc) { store[key].push(doc); persist(); return doc; },
    update(fn, patch) {
      const i = store[key].findIndex(fn);
      if (i >= 0) { Object.assign(store[key][i], patch); persist(); return store[key][i]; }
      return null;
    },
    remove(fn) { store[key] = store[key].filter(x => !fn(x)); persist(); },
  };
}

export const passengers = makeTable('passengers');
export const drivers    = makeTable('drivers');
export const rides      = makeTable('rides');
