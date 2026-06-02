import { createStorage } from './storage';

function validateCustomFn(fn) {
  if (typeof fn !== 'function')
    throw new TypeError('Expected a function as argument');
  if (fn.name === '') throw new Error('Function must have a name');

  if (fn.name in window) {
    if (typeof window[fn.name] === 'function') {
      throw new Error(`Function "${fn.name}" already exists on global scope`);
    }
    throw new Error(`Global name "${fn.name}" is already in use`);
  }

  const str = fn.toString();
  if (!str.endsWith('}'))
    throw new Error('Function must use a block body `{}` (no implicit return)');
  return str.slice(str.indexOf('{') + 1, str.lastIndexOf('}'));
}

function getParams(fn) {
  const str = fn.toString();
  const argsStr = str.match(/\(([\s\S]*?)\)/)?.[1] || '';

  const params = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (inString) {
      current += char;
      if (char === stringChar && argsStr[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === '(' || char === '{' || char === '[') depth++;
    if (char === ')' || char === '}' || char === ']') depth--;

    if (char === ',' && depth === 0) {
      params.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) params.push(current.trim());
  return params;
}

function getCustomFns(key) {
  const storage = createStorage(Shopify.theme.schema_name);
  return new Map(storage.get(key) ?? []);
}

function getCustomFn(key, name) {
  const customFns = getCustomFns(key);
  return customFns.get(name) && new Function(customFns.get(name));
}

function saveCustomFns(key, customFns) {
  const storage = createStorage(Shopify.theme.schema_name);
  storage.set(key, [...customFns]);
}

function removeCustomFn(key, name) {
  const customFns = getCustomFns(key);
  if (customFns.delete(name)) {
    saveCustomFns(key, customFns);
    return true;
  }
  return false;
}

const RUNNABLE_KEY = 'runnableFns';
const REGISTERED_KEY = 'registeredFns';

function addRunnableFn(fn) {
  const body = validateCustomFn(fn);
  const customFns = getCustomFns(RUNNABLE_KEY);
  customFns.set(fn.name, body);
  saveCustomFns(RUNNABLE_KEY, customFns);
}

function registerFn(fn) {
  const body = validateCustomFn(fn);
  const params = getParams(fn);
  const customFns = getCustomFns(REGISTERED_KEY);
  customFns.set(fn.name, { params, body });
  saveCustomFns(REGISTERED_KEY, customFns);
}

function getRunnableFns(key) {
  return getCustomFns(RUNNABLE_KEY);
}

function getRegisteredFns(key) {
  return getCustomFns(REGISTERED_KEY);
}

function removeRunnableFn(name) {
  return removeCustomFn(RUNNABLE_KEY, name);
}

function removeRegisteredFn(name) {
  return removeCustomFn(REGISTERED_KEY, name);
}

function execute() {
  const registeredFns = getRegisteredFns();
  registeredFns.forEach(({ params, body }, name) => {
    if (window[name]) {
      console.warn(
        `Skipping registration of function "${name}" as it already exists on global scope`
      );
      return;
    }
    window[name] = new Function(...params, body);
  });

  const runnableFns = getRunnableFns();
  runnableFns.forEach(body => {
    const fn = new Function(body);
    fn();
  });
}

export default {
  addRunnableFn,
  registerFn,
  getRunnableFns,
  getRegisteredFns,
  removeRunnableFn,
  removeRegisteredFn,
  execute,
};
