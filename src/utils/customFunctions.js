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

function addRunnableFn(fn) {
  const key = 'runnableFns';
  const body = validateCustomFn(fn);
  const customFns = getCustomFns(key);
  customFns.set(fn.name, body);
  saveCustomFns(key, customFns);
}

function registerFn(fn) {
  const key = 'registeredFns';
  const body = validateCustomFn(fn);
  const params = getParams(fn);
  const customFns = getCustomFns(key);
  customFns.set(fn.name, { params, body });
  saveCustomFns(key, customFns);
}

function getCustomFns(key) {
  const storage = createStorage(Shopify.theme.schema_name);
  return new Map(storage.get(key) ?? []);
}

function getRunnableFns(key) {
  const runnableFns = getCustomFns('runnableFns');
}

function getRegisteredFns(key) {
  const registeredFns = getCustomFns('registeredFns');
}

function saveCustomFns(key, customFns) {
  const storage = createStorage(Shopify.theme.schema_name);
  storage.set(key, [...customFns]);
}

function getCustomFnNames() {
  const storage = createStorage(Shopify.theme.schema_name);
  return new Map(storage.get('customFns') ?? []).keys().toArray();
}

function getCustomFn(name) { 
  const customFns = getCustomFns();
  return customFns.get(name) && new Function(customFns.get(name));
}

function removeCustomFn(name) {
  const customFns = getCustomFns();
  const storage = createStorage(Shopify.theme.schema_name);
  if (customFns.delete(name)) {
    storage.set('customFns', [...customFns]);
    return true;
  }
  return false;
}

export default {
  addRunnableFn,
  registerFn,
  getCustomFn,
  removeCustomFn
};
