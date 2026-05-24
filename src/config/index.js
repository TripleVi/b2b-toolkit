import { createStorage } from '../utils/storage.js';

const DEFAULTS = {
  search: {
    color: 'blue',
    priceColor: 'red',
    highlightElements: true,
  },
  collection: {
    color: 'green',
    priceColor: 'red',
    highlightElements: true,
  },
  cart: {
    color: 'orange',
    priceColor: 'red',
    highlightElements: true,
  },
  form: {
    main: { color: 'purple', priceColor: 'red' },
    quickView: { color: 'teal', priceColor: 'red' },
    featured: { color: 'teal', priceColor: 'red' },
    quickOrderList: { color: 'teal', priceColor: 'red' },
    highlightElements: true,
  },
};

/**
 * @description Deep merge: recursively merge source into target. Only merge plain object, not array or primitive.
 * @param {Object} target the default config object
 * @param {Object} source the saved config object, which may only contain partial fields
 * @returns the merged object, which has the same structure as target, but with values from source if provided
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const t = target[key],
      s = source[key];
    const bothObjects =
      s &&
      t &&
      typeof s === 'object' &&
      !Array.isArray(s) &&
      typeof t === 'object' &&
      !Array.isArray(t);
    result[key] = bothObjects ? deepMerge(t, s) : s;
  }
  return result;
}

// "forms.main.color" → ["forms", "main", "color"]
function parsePath(path) {
  return typeof path === 'string' ? path.split('.') : [path];
}

/**
 * @description dot-path access
 * @param {Object} obj
 * @param {string} path
 * @returns value at the path, or undefined if not exist
 */
function getByPath(obj, path) {
  return parsePath(path).reduce(
    (cur, key) => (cur != null ? cur[key] : undefined),
    obj
  );
}

/**
 * @description Set value by dot-path, return a new object (non-mutating)
 * @param {Object} obj
 * @param {string} path
 * @param {string} value
 * @returns new object with the updated value
 */
function setByPath(obj, path, value) {
  const keys = parsePath(path);
  const result = { ...obj };
  let cur = result;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...cur[keys[i]] };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}

function createAppConfig() {
  const storage = createStorage(Shopify.theme.schema_name);
  const STORAGE_KEY = 'config';
  const listeners = [];

  function _load() {
    const saved = storage.get(STORAGE_KEY) ?? {};
    return deepMerge(DEFAULTS, saved);
  }

  function get(path) {
    const cfg = _load();
    return path ? getByPath(cfg, path) : cfg;
  }

  function set(path, value) {
    const cfg = _load();
    const next = setByPath(cfg, path, value);
    storage.set(STORAGE_KEY, next);
    listeners.forEach(fn => fn(path, value, next));
  }

  function reset(path) {
    if (!path) {
      storage.remove(STORAGE_KEY);
      listeners.forEach(fn => fn(null, null, { ...DEFAULTS }));
      return;
    }
    const defaultValue = getByPath(DEFAULTS, path);
    if (defaultValue !== undefined) set(path, defaultValue);
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => listeners.splice(listeners.indexOf(fn), 1);
  }

  return { get, set, reset, onChange };
}

export const config = createAppConfig();
