import { DOM_ATTRS } from '../constants/domAttributes';
import {
  handleCart,
  handleCollection,
  handleForms,
  handleSearch,
} from '../utils/highlightElements';
import { showToast } from '../utils/uiElements';

export function initEventTracker() {
  const MIN_HOOK_PRIORITY = 999999999;
  const MAX_HOOK_PRIORITY = -999999999;

  const { productObserver, cartObserver } = BSS_B2B.observer;

  productObserver.usePre('QuickviewLoaded', (ctx, next) => {
    getQuickViewInfo(ctx.payload.event);
    next();
  });

  productObserver.takeLatest(
    'QuickviewLoaded',
    ctx => {
      const formIds = ctx.payload.formIdMapProducts.keys().toArray();
      handleForms(formIds);
      BSS_B2B.logger.log('Quick view loaded', { ctx });
    },
    { priority: MAX_HOOK_PRIORITY }
  );

  productObserver.usePre('SearchBarLoaded', (ctx, next) => {
    BSS_B2B.logger.log('handle search bar', { ctx });
    next();
  });

  productObserver.takeEvery(
    'SearchBarLoaded',
    ctx => {
      const { notExistProductIds } = ctx.payload;
      handleSearch();
      BSS_B2B.logger.log('Search bar loaded', { notExistProductIds });
    },
    { priority: MIN_HOOK_PRIORITY }
  );

  productObserver.takeLatest(
    'VariantChange',
    ctx => {
      const { formId, currentVariant } = ctx.payload;
      showToast(`${ctx.topic}: ${currentVariant.id}`);
      handleForms([formId]);
    },
    { priority: MIN_HOOK_PRIORITY }
  );

  productObserver.takeEvery(
    'LoadedLazyProduct',
    () => {
      handleSearch();
      handleCollection();
      BSS_B2B.logger.log('process LoadedLazyProduct');
    },
    { priority: MIN_HOOK_PRIORITY }
  );

  cartObserver.takeLatest(
    'CartUpdate',
    () => {
      handleCart();
    },
    { priority: MIN_HOOK_PRIORITY }
  );
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
    BSS_B2B.logger.log(`[${tag}][PID: ${productId}] Start loading quick view`);
    return;
  }
  BSS_B2B.logger.error('[QuickView] No product available for form', { event });
}
