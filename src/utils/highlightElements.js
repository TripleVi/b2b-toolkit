import { config } from '../config/index.js';
import { DOM_ATTRS } from '../constants/domAttributes';
import { UI_CONTEXT } from '../constants/ui';
import { getAppliedRules, getAvailableRules } from './b2b';
import { getCartSelectors, getProductSelectors } from './selectors';
import { handleElementBadge, highlightEls, unhighlightEls } from './uiElements';

// export function highlightSearch() {
export function handleSearch() {
  const searchContainers = document.querySelectorAll(
    `[${DOM_ATTRS.SEARCHBAR_OBSERVER_ID}]`
  );

  searchContainers.forEach(container => {
    const searchId = container.getAttribute(DOM_ATTRS.SEARCHBAR_OBSERVER_ID);
    const searchBar = BSS_B2B.support.search[searchId] ?? {
      target: container,
      cards: {},
    };

    for (const [key, card] of Object.entries(searchBar.cards)) {
      if (card.target.isConnected && isHandled(card.target)) continue;
      delete searchBar.cards[key];
    }

    const cardEls = queryUnhandled(`[${DOM_ATTRS.PRODUCT_QB_ID}]`, container);
    const cards = handleProductCards({
      cardEls,
      uiContext: UI_CONTEXT.SEARCH,
    });

    searchBar.cards = { ...searchBar.cards, ...cards };
    BSS_B2B.support.search[searchId] = searchBar;
  });

  highlightSearch();
}

export function handleCollection() {
  const collection = BSS_B2B.support.collection;

  for (const [key, card] of Object.entries(collection)) {
    if (card.target.isConnected && isHandled(card.target)) continue;
    delete collection[key];
  }

  const cardEls = queryUnhandled(`[${DOM_ATTRS.PRODUCT_QB_ID}]`);
  const cards = handleProductCards({
    cardEls,
    uiContext: UI_CONTEXT.COLLECTION,
  });

  BSS_B2B.support.collection = { ...collection, ...cards };
  highlightCollection();
}

export function handleProductCards({ cardEls, uiContext }) {
  const cards = {};
  const notFoundProducts = [];
  cardEls.forEach(cardEl => {
    if (!cardEl.isConnected || isHandled(cardEl)) return;

    markAsHandled(cardEl);

    const id = +cardEl.getAttribute(DOM_ATTRS.PRODUCT_QB_ID);
    const product = BSS_B2B.storage.productStorage.get(id);
    if (!product) {
      notFoundProducts.push({ id, target: cardEl });
      return;
    }

    setUIContext(cardEl, uiContext);

    const priceEls = [
      ...cardEl.querySelectorAll(
        `[${DOM_ATTRS.PRODUCT_PRICE}][${DOM_ATTRS.PRODUCT_ID}="${id}"]`
      ),
    ];

    let currVariantId = product?.currentVariant?.id;

    if (!currVariantId && priceEls.length)
      currVariantId = +priceEls[0].getAttribute(DOM_ATTRS.VARIANT_ID);
    if (!currVariantId) currVariantId = product.variants[0].id;

    const currVariant = BSS_B2B.storage.variantStorage.get(currVariantId);
    const availableRules = getAvailableRules({ productId: id });
    const appliedRules = getAppliedRules({ productId: id });

    const quickViewBtns = [
      ...cardEl.querySelectorAll(`[${DOM_ATTRS.QUICKVIEW_BTN}]`),
    ];

    cards[currVariantId] = {
      target: cardEl,
      product,
      currVariant,
      quickViewBtns,
      appliedRules,
      availableRules,
      priceEls,
    };

    handleElementBadge({
      container: cardEl,
      productId: product.id,
      variantId: currVariantId,
      appliedRules,
      printInfo: () => console.log(cards[currVariantId]),
    });
  });
  if (notFoundProducts.length) {
    BSS_B2B.logger.error(
      'The following products are rendered on the page but not found in storage',
      notFoundProducts
    );
  }
  return cards;
}

export function handleForms(formIds) {
  const forms = BSS_B2B.support.forms;
  const productSelectors = getProductSelectors();

  for (const [location, locationForms] of Object.entries(forms)) {
    for (const [formId, locationForm] of Object.entries(locationForms)) {
      if (!locationForm.target.isConnected || !isHandled(locationForm.target))
        delete locationForms[formId];
    }
  }

  const notFoundForms = [];

  formIds =
    formIds ?? BSS_B2B.storage.productFormStorage.store.keys().toArray();
  formIds.forEach(formId => {
    const formEl = document.querySelector(
      `[${DOM_ATTRS.PRODUCT_FORM_ID}="${formId}"]`
    );
    if (!formEl?.isConnected) return;

    markAsHandled(formEl);

    const productForm = BSS_B2B.storage.productFormStorage.get(formId);
    if (!productForm) {
      notFoundForms.push({ formId, target: formEl });
      return;
    }

    const currVariantId = productForm.currentVariant?.id;
    const currVariant = BSS_B2B.storage.variantStorage.get(currVariantId);
    if (!currVariant) {
      BSS_B2B.logger.error(
        `Variant with id ${currVariantId} for form ${formId} not found in storage`,
        { formId, variantId: currVariantId, formEl }
      );
    }

    let location;
    switch (productForm.location) {
      case 'quickview':
        location = 'quickView';
        break;
      case 'feature':
        location = 'featured';
        break;
      case 'quick_order_list':
        location = 'quickOrderList';
        break;
      default:
        location = 'main';
    }

    const availableRules = getAvailableRules({ formId });
    const appliedRules = getAppliedRules({ formId });

    handleElementBadge({
      container: formEl,
      productId: productForm.id,
      variantId: currVariantId,
      appliedRules,
      printInfo: () => console.log(BSS_B2B.support.forms[location][formId]),
    });

    const priceEls = [
      ...formEl.querySelectorAll(`[${DOM_ATTRS.VARIANT_PRICE}]`),
    ];

    const cartFormEls = [
      ...formEl.querySelectorAll(productSelectors.product_cart_form),
    ];
    const cartForms = cartFormEls.map(cartFormEl => {
      const variantInputEls = cartFormEl.querySelectorAll(
        productSelectors.variant_input
      );
      const variantInputs = [...variantInputEls].map(variantInputEl => {
        const variantId = +variantInputEl.value;
        const variant = BSS_B2B.storage.variantStorage.get(variantId);
        return { target: variantInputEl, variantId, variant };
      });
      return { target: cartFormEl, variantInputs };
    });

    const changeQuantityEls = [
      ...formEl.querySelectorAll(
        [
          productSelectors.btn_up_quantity,
          productSelectors.btn_down_quantity,
          productSelectors.button_change_quantity,
        ].join(`,`)
      ),
    ];

    BSS_B2B.support.forms[location] = BSS_B2B.support.forms[location] ?? {};

    BSS_B2B.support.forms[location][formId] = {
      target: formEl,
      details: productForm,
      priceEls,
      cartForms,
      changeQuantityEls,
      appliedRules,
      availableRules,
    };
  });
  highlightForms();
  if (notFoundForms.length) {
    BSS_B2B.logger.error(
      'The following product forms are rendered on the page but not found in storage',
      notFoundForms
    );
  }
}

export function handleCart() {
  const cart = BSS_B2B.support.cart;
  cart.items = cart.items ?? {};

  for (const [key, item] of Object.entries(cart.items)) {
    if (!item.target.isConnected || !isHandled(item.target))
      delete cart.items[key];
  }

  const cartSelectors = getCartSelectors();

  for (const [cartKey, cartItem] of BSS_B2B.storage.cartStorage.getAll()) {
    const cartItemEl = document.querySelector(
      `[${DOM_ATTRS.CART_ITEM_KEY}="${cartKey}"]`
    );
    if (!cartItemEl?.isConnected) continue;

    markAsHandled(cartItemEl);

    const { product_id: productId, variant_id: variantId } = cartItem;

    const availableRules = getAvailableRules({ cartKey });
    const appliedRules = getAppliedRules({ cartKey });

    const originalPriceEls = [
      ...cartItemEl.querySelectorAll(`[${DOM_ATTRS.CART_ITEM_ORIGINAL_PRICE}]`),
    ];
    const finalLinePriceEls = [
      ...cartItemEl.querySelectorAll(`[${DOM_ATTRS.CART_FINAL_LINE_PRICE}]`),
    ];
    const changeQuantityEls = [
      ...cartItemEl.querySelectorAll(cartSelectors.button_change_quantity),
    ];

    cart.items[cartKey] = {
      target: cartItemEl,
      originalPriceEls,
      finalLinePriceEls,
      details: cartItem,
      product: BSS_B2B.storage.productStorage.get(productId),
      variant: BSS_B2B.storage.variantStorage.get(variantId),
      changeQuantityEls,
      appliedRules,
      availableRules,
    };

    handleElementBadge({
      container: cartItemEl,
      productId,
      variantId,
      appliedRules,
      printInfo: () => console.log(cart.items[cartKey]),
    });
  }

  cart.subTotalEls = [...BSS_B2B.utils.getSubtotalPriceElement()];
  cart.openMiniCartBtns = [
    ...document.querySelectorAll(cartSelectors.btn_open_mini_cart),
  ];
  cart.checkoutEls = [...BSS_B2B.utils.getCheckoutElements()];
  cart.addToCartBtns = [
    ...document.querySelectorAll(cartSelectors.btn_add_to_cart),
  ];

  highlightCart();
}

export function highlightSearch(force = false) {
  // if (!force) {
  //   if (config.get('search.highlightElements')) return;
  // }
  config.set('search.highlightElements', true);
  for (const searchBar of Object.values(BSS_B2B.support.search)) {
    const cards = Object.values(searchBar.cards);
    highlightEls([searchBar.target], 'search');
    highlightEls(
      cards.map(c => c.target),
      'search.card'
    );
    highlightEls(
      cards.flatMap(c => c.priceEls),
      'search.price'
    );
    highlightEls(
      cards.flatMap(c => c.quickViewBtns),
      'search.quickViewBtn'
    );
  }
}

export function unhighlightSearch(force = false) {
  // if (!force) {
  //   if (!config.get('search.highlightElements')) return;
  // }
  config.set('search.highlightElements', false);
  for (const searchBar of Object.values(BSS_B2B.support.search)) {
    const cards = Object.values(searchBar.cards);
    unhighlightEls([
      searchBar.target,
      ...cards.map(c => c.target),
      ...cards.flatMap(c => c.priceEls),
      ...cards.flatMap(c => c.quickViewBtns),
    ]);
  }
}

export function highlightCollection(force = false) {
  // if (!force && config.get('collection.highlightElements')) return;
  config.set('collection.highlightElements', true);
  for (const card of Object.values(BSS_B2B.support.collection)) {
    highlightEls([card.target], 'collection.card');
    highlightEls(card.priceEls, 'collection.price');
    highlightEls(card.quickViewBtns, 'collection.quickViewBtn');
  }
}

export function unhighlightCollection(force = false) {
  // if (!force) {
  //   if (!config.get('collection.highlightElements')) return;
  // }
  config.set('collection.highlightElements', false);
  for (const card of Object.values(BSS_B2B.support.collection)) {
    unhighlightEls([card.target, ...card.priceEls, ...card.quickViewBtns]);
  }
}

export function highlightForms(force = false) {
  // if (!force && config.get('forms.highlightElements')) return;
  config.set('forms.highlightElements', true);
  for (const [location, locationForms] of Object.entries(
    BSS_B2B.support.forms
  )) {
    for (const form of Object.values(locationForms)) {
      highlightEls([form.target], `form.${location}`);
      highlightEls(form.priceEls, `form.${location}.price`);
      highlightEls(form.changeQuantityEls, `form.${location}.changeQuantity`);
      highlightEls(
        form.cartForms.map(cf => cf.target),
        `form.${location}.cartForm`
      );
    }
  }
}

export function unhighlightForms(force = false) {
  // if (!force && !config.get('forms.highlightElements')) return;
  config.set('forms.highlightElements', false);
  for (const locationForms of Object.values(BSS_B2B.support.forms)) {
    for (const form of Object.values(locationForms)) {
      unhighlightEls([
        form.target,
        ...form.priceEls,
        ...form.changeQuantityEls,
        ...form.cartForms.map(cf => cf.target),
      ]);
    }
  }
}

export function highlightCart(force = false) {
  // if (!force && config.get('cart.highlightElements')) return;
  config.set('cart.highlightElements', true);
  const cart = BSS_B2B.support.cart;
  for (const item of Object.values(cart.items)) {
    highlightEls([item.target], 'cart.card');
    highlightEls(item.originalPriceEls, 'cart.originalPrice');
    highlightEls(item.finalLinePriceEls, 'cart.linePrice');
    highlightEls(item.changeQuantityEls, 'cart.changeQuantity');
  }
  highlightEls(cart.subTotalEls, 'cart.subtotal');
  highlightEls([
    ...cart.openMiniCartBtns,
    ...cart.checkoutEls,
    ...cart.addToCartBtns,
  ]);
}

export function unhighlightCart(force = false) {
  // if (!force && !config.get('cart.highlightElements')) return;
  config.set('cart.highlightElements', false);
  const cart = BSS_B2B.support.cart;
  for (const [key, item] of Object.entries(cart.items)) {
    unhighlightEls([
      item.target,
      ...item.originalPriceEls,
      ...item.finalLinePriceEls,
      ...item.changeQuantityEls,
    ]);
  }
  unhighlightEls([
    ...cart.subTotalEls,
    ...cart.openMiniCartBtns,
    ...cart.checkoutEls,
    ...cart.addToCartBtns,
  ]);
}

const HANDLED_ATTR = 'handled';

function markAsHandled(el) {
  el.dataset[HANDLED_ATTR] = 'true';
}

function unmarkAsHandled(el) {
  delete el.dataset[HANDLED_ATTR];
}

function isHandled(el) {
  return el.dataset[HANDLED_ATTR] === 'true';
}

function queryUnhandled(selector, root = document) {
  return root.querySelectorAll(`${selector}:not([data-handled="true"])`);
}

function setUIContext(el, context) {
  if (!el) return;
  el.setAttribute('data-ui-context', context);
}
