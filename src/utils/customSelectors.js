export function initCustomSelectors() {
  const tag = 'custom:config_theme/installation';
  if (bssB2BHooks.filters[tag]) delete bssB2BHooks.filters[tag];

  const addFilter = BSS_B2B.addFilter ?? BSS_B2B.custom.addFilter;
  addFilter(tag, (config, { page }) => {
    const customSelectors = shopStorage.get('customSelectors') ?? {};
    return customSelectors[page] ?? config;
  });

  const customSelectors = shopStorage.get('customSelectors') ?? {
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
  customSelectors.save = () =>
    BSS_B2B.support.shopStorage.set('customSelectors', BSS_B2B.support.customSelectors);
  customSelectors.enable = () => {
    delete bssB2BHooks.filters[tag];
  };
  customSelectors.disable = () => {
    delete bssB2BHooks.filters[tag];
    addFilter(tag, (config, { page }) => {
      const customSelectors = BSS_B2B.support.shopStorage.get('customSelectors') ?? {};
      return customSelectors[page] ?? config;
    });
  };
  customSelectors.destroy = () => {
    BSS_B2B.support.shopStorage.remove('customSelectors');
    delete BSS_B2B.support.customSelectors;
    delete bssB2BHooks.filters[tag];
  };

  BSS_B2B.support = {
    ...BSS_B2B.support,
    _customSelectors: customSelectors,
    get customSelectors() {
      return this._customSelectors;
    },
  };
}

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
