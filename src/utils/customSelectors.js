const DEFAULTS = {
  collection: {
    selectorCard: ':not(*)',
    selectorPrice: ':not(*)',
    selectorQuickviewBtn: ':not(*)',
    selectorSearchBar: ':not(*)',
  },
  product: { selectorForm: ':not(*)', selectorPrice: ':not(*)' },
  miniCart: {
    selectorCard: ':not(*)',
    selectorOriginPrice: ':not(*)',
    selectorFinalLinePrice: ':not(*)',
    selectorSubtotalPrice: ':not(*)',
  },
  cart: {
    selectorCard: ':not(*)',
    selectorOriginPrice: ':not(*)',
    selectorFinalLinePrice: ':not(*)',
    selectorSubtotalPrice: ':not(*)',
  },
  quickView: { selectorCard: ':not(*)', selectorPrice: ':not(*)' },
  searchBar: { selectorCard: ':not(*)', selectorPrice: ':not(*)' },
};

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

function validateAndMerge(defaults, modified) {
  const result = {};

  for (const key of Object.keys(defaults)) {
    const defVal = defaults[key];
    const modVal = modified?.[key];

    if (modVal === undefined) {
      result[key] = defVal;
      continue;
    }

    const defType = typeof defVal;
    const modType = typeof modVal;

    if (
      defType === 'object' &&
      modType === 'object' &&
      !Array.isArray(defVal) &&
      !Array.isArray(modVal) &&
      defVal !== null &&
      modVal !== null
    ) {
      result[key] = validateAndMerge(defVal, modVal);
      continue;
    }

    if (defType !== modType) {
      result[key] = defVal;
      continue;
    }

    result[key] = modVal;
  }

  return result;
}

function createCustomSelectors() {
  const STORAGE_KEY = 'customSelectors';
  const storage = BSS_B2B.support.shopStorage;
  const publicConfig = deepMerge(DEFAULTS, {});
  const addFilter = BSS_B2B.addFilter ?? BSS_B2B.custom.addFilter;
  const tag = 'custom:config_theme/installation';

  function init() {
    if (bssB2BHooks.filters[tag]) delete bssB2BHooks.filters[tag];
    addFilter(tag, (config, { page }) => {
      const customSelectors = get();
      return customSelectors[page] ?? config;
    });
  }

  function get() {
    return storage.get(STORAGE_KEY) ?? {};
  }

  function save() {
    const current = get();
    const merged = validateAndMerge(current, publicConfig);
    storage.set(STORAGE_KEY, merged);
    return merged;
  }

  function enable() {
    delete bssB2BHooks.filters[tag];
  }

  function disable() {
    delete bssB2BHooks.filters[tag];
    addFilter(tag, (config, { page }) => {
      const customSelectors = get();
      return customSelectors[page] ?? config;
    });
  }

  function destroy() {
    storage.remove(STORAGE_KEY);
    delete BSS_B2B.support.customSelectors;
    delete bssB2BHooks.filters[tag];
  }

  return {
    publicConfig,
    init,
    get,
    save,
    enable,
    disable,
    destroy
  };
}

export const { publicConfig, config } = (() => {
  const instance = createCustomSelectors();
  return {
    publicConfig: instance.publicConfig,
    customSelectors: instance,
  };
})();

export function generateCode() {
  const runnableFns = getCustomFns('runnableFns');
  const fns = [];
  runnableFns.forEach((body, name) => {
    const fn = new Function(body);
    const str = fn.toString().replace('function anonymous', `function ${name}`);
    fns.push(`
        ${str}
        ${name}();
      `);
    fn();
  });
  return `
      const customSelectors = ${JSON.stringify(BSS_B2B.support.customSelectors)};
      function configTheme(config, { page }) {
        return customSelector[page] || config;
      }
      BSS_B2B.addFilter('custom:config_theme/installation', configTheme);
      ${fns.join()}
    `;
}
