export function validateCustomFn(fn) {
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

export function getParams(fn) {
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

export function addRunnableFn(fn) {
  const key = 'runnableFns';
  const body = validateCustomFn(fn);
  const customFns = getCustomFns(key);
  customFns.set(fn.name, body);
  saveCustomFns(key, customFns);
}

export function registerFn(fn) {
  const key = 'registeredFns';
  const body = validateCustomFn(fn);
  const params = getParams(fn);
  const customFns = getCustomFns(key);
  customFns.set(fn.name, { params, body });
  saveCustomFns(key, customFns);
}

export function getCustomFns(key) {
  return new Map(BSS_B2B.support.shopStorage.get(key) ?? []);
}

export function getRunnableFns(key) {
  const runnableFns = getCustomFns('runnableFns');
}

export function getRegisteredFns(key) {
  const registeredFns = getCustomFns('registeredFns');
}

export function saveCustomFns(key, customFns) {
  BSS_B2B.support.shopStorage.set(key, [...customFns]);
}

export function getCustomFnNames() {
  return new Map(BSS_B2B.support.shopStorage.get('customFns') ?? []).keys().toArray();
}

export function getCustomFn(name) {
  const customFns = getCustomFns();
  return customFns.get(name) && new Function(customFns.get(name));
}

export function removeCustomFn(name) {
  const customFns = getCustomFns();
  if (customFns.delete(name)) {
    BSS_B2B.support.shopStorage.set('customFns', [...customFns]);
    return true;
  }
  return false;
}
