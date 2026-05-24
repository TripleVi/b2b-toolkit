export function createStorage(namespace = 'app', storage = localStorage) {
  function buildKey(key) {
    return `${namespace}:${key}`;
  }

  function set(key, value, options = {}) {
    const { ttl } = options;

    const data = {
      value,
      expiry: ttl ? Date.now() + ttl : null,
    };

    try {
      storage.setItem(buildKey(key), JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Storage set error:', err);
      return false;
    }
  }

  function get(key) {
    try {
      const raw = storage.getItem(buildKey(key));
      if (!raw) return null;

      const data = JSON.parse(raw);

      if (data.expiry && Date.now() > data.expiry) {
        storage.removeItem(buildKey(key));
        return null;
      }

      return data.value;
    } catch (err) {
      console.error('Storage get error:', err);
      return null;
    }
  }

  function remove(key) {
    storage.removeItem(buildKey(key));
  }

  function clear() {
    Object.keys(storage).forEach(k => {
      if (k.startsWith(namespace + ':')) {
        storage.removeItem(k);
      }
    });
  }

  function exists(key) {
    return get(key) !== null;
  }

  return {
    set,
    get,
    remove,
    clear,
    exists,
    namespace,
  };
}
