import { createStorage } from './storage';

export function initDevMode() {
  const STORAGE_KEY = 'devMode';
  const storage = createStorage();

  storage.exists(STORAGE_KEY) || setDevMode(true);

  function setDevMode(enabled) {
    storage.set(STORAGE_KEY, enabled);
  }

  function enableDevMode() {
    setDevMode(true);
    BSS_B2B.logger.log('Dev mode enabled');
  }

  function disableDevMode() {
    setDevMode(false);
    BSS_B2B.logger.log('Dev mode disabled');
  }

  function isDevModeEnabled() {
    return storage.get(STORAGE_KEY) === true;
  }

  function isDevModeDisabled() {
    return !isDevModeEnabled();
  }

  return { enableDevMode, disableDevMode, isDevModeEnabled, isDevModeDisabled };
}

function getElements(selectorList, root = document) {
  return [...root.querySelectorAll(selectorList)];
}

function createDeepProxy(obj, callback) {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value === 'object' && value !== null) {
        return createDeepProxy(value, callback);
      }
      return value;
    },
    set(target, prop, value) {
      target[prop] = value;
      callback(prop, value);
      return true;
    },
  });
}

const docs = [
  `https://navy-temper-e3f.notion.site/Install-2b71dd53fedf80ed8aa4d721b36b905a`,
];
