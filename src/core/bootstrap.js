import { config } from '../config';
import { getAppliedRules, getAvailableRules } from '../utils/b2b';
import customFn from '../utils/customFunctions';
import { customSelector, generateCode } from '../utils/customSelectors';
import {
  handleCart,
  handleCollection,
  handleForms,
  handleSearch,
  highlightCart,
  highlightCollection,
  highlightForms,
  highlightSearch,
  unhighlightCart,
  unhighlightCollection,
  unhighlightForms,
  unhighlightSearch,
} from '../utils/highlightElements';
import { getShopifyProductLink, getShopifyVariantLink } from '../utils/shopify';
import { createStorage } from '../utils/storage';
import { upsertStyleTag } from '../utils/uiElements';
import { initEventTracker } from './event-tracker';
import { processCart, processForms, processProductList } from './pricing';

export default function bootstrapApp() {
  window.bssB2BHooks = window.bssB2BHooks ?? { actions: {}, filters: {} };
  window.BSS_B2B = window.BSS_B2B ?? {};
  BSS_B2B.addAction = (tag, callback) => (bssB2BHooks.actions[tag] = callback);
  BSS_B2B.addFilter = (tag, callback) => (bssB2BHooks.filters[tag] = callback);

  const shopStorage = createStorage(Shopify.theme.schema_name);

  if (customFn.isEnabled()) customFn.execute();

  if (customSelector.isEnabled()) customSelector.init();

  BSS_B2B.support = {
    collection: {},
    search: {},
    forms: {},
    cart: {},
    utils: {},
    shopStorage,
    configs: {
      values: config.publicConfig,
      save() {
        return config.save();
      },
    },
    customSelector,
    customFn,
  };

  Object.assign(BSS_B2B.support.utils, {
    processProductList,
    processCart,
    processForms,
    getShopifyProductLink,
    getShopifyVariantLink,
    getAvailableRules,
    getAppliedRules,
    generateCode,
    upsertStyleTag,
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
