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
  const shopStorage = createStorage(Shopify.theme.schema_name);

  if (customFn.isEnabled()) customFn.execute();

  if (customSelector.isEnabled()) customSelector.init();

  Object.assign(BSS_B2B.support, {
    collection: {},
    search: {},
    forms: {},
    cart: {},
    shopStorage,
    configs: {
      values: config.publicConfig,
      save() {
        return config.save();
      },
    },
    customSelector,
    customFn,
  });

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
    '%c 🛠️ B2B Toolkit v0.1.1 %c by LV ✨',
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

  const storage = createStorage();
  console.log(
    `%c[bss.b2b] Dev mode ${storage.get('devMode') ? 'enabled' : 'disabled'}`,
    'color: pink; font-weight: 600; font-style: italic;'
  );

  return () => {
    initEventTracker();
    handleSearch();
    handleCollection();
    handleCart();
    handleForms();
  };
}
