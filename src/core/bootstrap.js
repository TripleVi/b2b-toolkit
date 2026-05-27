import { config, publicConfig } from "../config";
import { customSelectors } from "../utils/customSelectors";
import { handleCart, handleCollection, handleForms, handleSearch, highlightCart, highlightCollection, highlightForms, highlightSearch, unhighlightCart, unhighlightCollection, unhighlightForms, unhighlightSearch } from "../utils/highlightElements";
import { createStorage } from "../utils/storage";
import { initEventTracker } from "./event-tracker";

export function bootstrapApp() {
  window.bssB2BHooks = window.bssB2BHooks ?? { actions: {}, filters: {} };
  window.BSS_B2B = window.BSS_B2B ?? {};
  BSS_B2B.addAction = (tag, callback) => (bssB2BHooks.actions[tag] = callback);
  BSS_B2B.addFilter = (tag, callback) => (bssB2BHooks.filters[tag] = callback);

  (() => {
    // const registeredFns = getCustomFns('registeredFns');
    // const runnableFns = getCustomFns('runnableFns');

    // registeredFns.forEach(
    //   ({ params, body }, name) => (window[name] = new Function(...params, body))
    // );
    // runnableFns.forEach(body => {
    //   const fn = new Function(body);
    //   fn();
    // });

    if (customSelectors.hasData()) customSelectors.init();

    // load config
    // shopStorage.set('configs', { isHighlighted: true });
  })();

  const shopStorage = createStorage(Shopify.theme.schema_name);

  BSS_B2B.support = {
    collection: {},
    search: {},
    forms: {},
    cart: {},
    utils: {},
    shopStorage,
    configs: {
      values: publicConfig,
      save() {
        return config.save();
      },
    },
    customSelectors,
  };

  Object.assign(BSS_B2B.support.utils, {
    // initCustomSelectors,
    // processProductCards,
    // processCart,
    // processForm,
    // addRunnableFn,
    // registerFn,
    // getCustomFnNames,
    // getCustomFn,
    // removeCustomFn,
    // getShopifyProductLink,
    // getShopifyVariantLink,
    // getAvailableRules,
    // getAppliedRules,
    // generateCode,
    // upsertStyleTag,
    highlightSearch,
    highlightCollection,
    highlightForms,
    highlightCart,
    unhighlightSearch,
    unhighlightCollection,
    unhighlightForms,
    unhighlightCart,
  });

  console.log(
    '%c 🛠️ B2B Toolkit v1.0.0 %c by LV ✨',
    `
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 12px;
      border-radius: 10px 0 0 10px;
      font-size: 14px;
      font-weight: 700;
    `,
    `
      background: #111827;
      color: #93c5fd;
      padding: 8px 8px;
      border-radius: 0 10px 10px 0;
      font-size: 13px;
      font-weight: 600;
    `
  );

  return () => {
      initEventTracker();
      handleSearch();
      handleCollection();
      handleCart();
      handleForms();
    };
}
