import { DOM_ATTRS } from './constants/domAttributes';
import { getAppliedRules, getAvailableRules } from './utils/b2b';
import {
  addRunnableFn,
  getCustomFn,
  getCustomFnNames,
  getCustomFns,
  registerFn,
  removeCustomFn,
} from './utils/customFunctions.js';
import { generateCode, initCustomSelectors } from './utils/customSelectors';
import {
  highlightCart,
  highlightCollection,
  highlightForms,
  highlightSearch,
  unhighlightCart,
  unhighlightCollection,
  unhighlightForms,
  unhighlightSearch,
} from './utils/highlightElements';
import { getShopifyProductLink, getShopifyVariantLink } from './utils/shopify';
import { createStorage } from './utils/storage';
import { upsertStyleTag } from './utils/uiElements';
import { config } from './config/index.js';

(() => {
  if (!window.Shopify) return;

  console.log('updated 123', config.get());

  window.bssB2BHooks = window.bssB2BHooks ?? { actions: {}, filters: {} };
  window.BSS_B2B = window.BSS_B2B ?? {};
  BSS_B2B.addAction = (tag, callback) => (bssB2BHooks.actions[tag] = callback);
  BSS_B2B.addFilter = (tag, callback) => (bssB2BHooks.filters[tag] = callback);

  const docs = [
    `https://navy-temper-e3f.notion.site/Install-2b71dd53fedf80ed8aa4d721b36b905a`,
  ];
  const shopStorage = createStorage(Shopify.theme.schema_name);
  BSS_B2B.support = {
    collection: {},
    search: {},
    forms: {},
    cart: {},
    utils: {},
    shopStorage,
    docs,
  };

  // Run custom code
  (() => {
    const registeredFns = getCustomFns('registeredFns');
    const runnableFns = getCustomFns('runnableFns');

    registeredFns.forEach(
      ({ params, body }, name) => (window[name] = new Function(...params, body))
    );
    runnableFns.forEach(body => {
      const fn = new Function(body);
      fn();
    });

    const customSelectors = shopStorage.get('customSelectors');
    if (customSelectors) initCustomSelectors();

    // load config
    // shopStorage.set('configs', { isHighlighted: true });
  })();

  const toolSupport = () => {
    Object.assign(BSS_B2B.support.utils, {
      initCustomSelectors,
      processProductCards,
      processCart,
      processForm,
      addRunnableFn,
      registerFn,
      getCustomFnNames,
      getCustomFn,
      removeCustomFn,
      getShopifyProductLink,
      getShopifyVariantLink,
      getAvailableRules,
      getAppliedRules,
      generateCode,
      upsertStyleTag,
      unhighlightSearch,
      unhighlightCollection,
      unhighlightForms,
      unhighlightCart,
    });

    (function main() {
      const MIN_HOOK_PRIORITY = 999999;
      const MAX_HOOK_PRIORITY = -999999;

      const { productObserver, cartObserver } = BSS_B2B.observer;

      productObserver.usePre('QuickviewLoaded', (ctx, next) => {
        getQuickViewInfo(ctx.payload.event);
        next();
      });

      productObserver.takeLatest(
        'QuickviewLoaded',
        ctx => {
          const formIds = ctx.payload.formIdMapProducts.keys().toArray();
          highlightForms(formIds);
          console.info('Quick view loaded', { ctx });
        },
        { priority: MAX_HOOK_PRIORITY }
      );

      productObserver.usePre('SearchBarLoaded', (ctx, next) => {
        console.log('handle search bar', ctx);
        next();
      });

      productObserver.takeEvery(
        'SearchBarLoaded',
        ctx => {
          const { notExistProductIds } = ctx.payload;
          highlightSearch();
          console.info('Search bar loaded', { notExistProductIds });
        },
        { priority: MIN_HOOK_PRIORITY }
      );

      productObserver.takeLatest(
        'VariantChange',
        ctx => {
          const { formId, currentVariant } = ctx.payload;
          showToast(`${ctx.topic}: ${currentVariant.id}`);
          highlightForms([formId]);
        },
        { priority: MIN_HOOK_PRIORITY }
      );

      productObserver.takeEvery(
        'LoadedLazyProduct',
        () => {
          highlightSearch();
          highlightCollection();
          console.info('process LoadedLazyProduct');
        },
        { priority: MIN_HOOK_PRIORITY }
      );

      cartObserver.takeLatest(
        'CartUpdate',
        () => {
          highlightCart();
        },
        { priority: MIN_HOOK_PRIORITY }
      );

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

      highlightSearch();
      highlightCollection();
      highlightCart();
      highlightForms();
    })();

    BSS_B2B.support.setDeveloperMode = function () {
      window.localStorage.developerMode = true;
      console.log(
        `%c[BSS_B2B LOG] window.localStorage.developerMode: ${window.localStorage.developerMode}`,
        'color: #00aaff; font-weight: bold'
      );
    };

    function getElements(selectorList, root = document) {
      return [...root.querySelectorAll(selectorList)];
    }

    function getQuickViewInfo(event) {
      const tag = 'QuickView';
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        console.info(`[${tag}] Start loading quick view`, { event });
        return;
      }
      let productId;
      const priceEl = target.querySelector(
        `[${DOM_ATTRS.PRODUCT_ID}][${DOM_ATTRS.VARIANT_PRICE}]`
      );
      if (priceEl) productId = priceEl.getAttribute(DOM_ATTRS.PRODUCT_ID);
      else {
        const productCache = BSS_B2B.productMap;
        const collectionProducts = ShopifyAnalytics.meta.products ?? [];
        const link = target.querySelector('a[href*="/products/"]');
        const href = link?.getAttribute('href');
        const handle = href?.split('/products/')[1]?.split('?')[0];
        const product =
          (handle && collectionProducts.find(p => p.handle === handle)) ??
          productCache.get(handle);
        productId = product?.id;
      }
      if (productId) {
        console.info(`[${tag}][PID: ${productId}] Start loading quick view`);
        return;
      }
      console.error('[QuickView] No product available for form', { event });
    }

    function processProductCards() {
      window.dispatchEvent(new Event('scroll'));
    }
    function processForm() {
      window.dispatchEvent(new Event('scroll'));
    }
    function processCart() {
      document.dispatchEvent(new Event('bss_b2b:CustomCartUpdate'));
    }
  };

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

  window.addEventListener('bss_b2b:module:loaded', toolSupport, { once: true });
})();
