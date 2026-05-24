import { DOM_ATTRS } from '../constants/domAttributes';
import { UI_CONTEXT } from '../constants/ui';
import { getAppliedRules, getAvailableRules } from './b2b';
import { getCartSelectors, getProductSelectors } from './selectors';
import { handleElementBadge, highlightEls, isHighlighted, unhighlightEls } from './uiElements';
import { config } from '../config/index.js';

export function highlightSearch() {
  if (!config.get('search.highlightElements')) return;

  const searchContainers = document.querySelectorAll(
    `[${DOM_ATTRS.SEARCHBAR_OBSERVER_ID}]`
  );
  searchContainers.forEach(container => {
    highlightEls([container]);

    const searchId = container.getAttribute(DOM_ATTRS.SEARCHBAR_OBSERVER_ID);
    const searchBar = BSS_B2B.support.search[searchId] ?? {
      target: container,
      cards: {},
    };

    for (const [key, card] of Object.entries(searchBar.cards)) {
      if (card.target.isConnected && isHighlighted(card.target)) continue;
      delete searchBar.cards[key];
    }

    const cardEls = container.querySelectorAll(
      `[${DOM_ATTRS.PRODUCT_QB_ID}]:not(.highlight)`
    );
    const cards = highlightProductCards({
      cardEls,
      uiContext: UI_CONTEXT.SEARCH,
    });

    searchBar.cards = { ...searchBar.cards, ...cards };
    BSS_B2B.support.search[searchId] = searchBar;
  });
}

export function highlightCollection() {
  if (!config.get('collection.highlightElements')) return;

  const collection = BSS_B2B.support.collection;

  for (const [key, card] of Object.entries(collection)) {
    if (card.target.isConnected && isHighlighted(card.target)) continue;
    delete collection[key];
  }

  const cardEls = document.querySelectorAll(
    `[${DOM_ATTRS.PRODUCT_QB_ID}]:not(.highlight)`
  );
  const cards = highlightProductCards({
    cardEls,
    uiContext: UI_CONTEXT.COLLECTION,
  });

  BSS_B2B.support.collection = { ...collection, ...cards };
}

export function highlightProductCards({ cardEls, uiContext }) {
  const cards = {};
  const notFoundProducts = [];
  cardEls.forEach(cardEl => {
    if (!cardEl.isConnected || isHighlighted(cardEl)) return;

    const id = +cardEl.getAttribute(DOM_ATTRS.PRODUCT_QB_ID);
    const product = BSS_B2B.storage.productStorage.get(id);
    if (!product) {
      notFoundProducts.push({ id, target: cardEl });
      return;
    }

    setUIContext(cardEl, uiContext);
    highlightEls([cardEl]);

    const priceEls = [
      ...cardEl.querySelectorAll(
        `[${DOM_ATTRS.PRODUCT_PRICE}][${DOM_ATTRS.PRODUCT_ID}="${id}"]`
      ),
    ];
    highlightEls(priceEls, UI_CONTEXT.PRODUCT_PRICE);

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
    highlightEls(quickViewBtns);

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

export function highlightForms(formIds) {
  if (!config.get('form.highlightElements')) return;

  const forms = BSS_B2B.support.forms;
  const productSelectors = getProductSelectors();

  for (const [location, locationForms] of Object.entries(forms)) {
    for (const [formId, locationForm] of Object.entries(locationForms)) {
      if (
        !locationForm.target.isConnected ||
        !isHighlighted(locationForm.target)
      )
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

    const location = productForm.location;

    // setUIContext(formEl, UI_CONTEXT.PRODUCT_PAGE);

    const availableRules = getAvailableRules({ formId });
    const appliedRules = getAppliedRules({ formId });

    highlightEls([formEl]);
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
    highlightEls(priceEls, UI_CONTEXT.PRODUCT_PRICE);

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
    highlightEls(cartFormEls);

    const changeQuantityEls = [
      ...formEl.querySelectorAll(
        [
          productSelectors.btn_up_quantity,
          productSelectors.btn_down_quantity,
          productSelectors.button_change_quantity,
        ].join(`,`)
      ),
    ];
    highlightEls(changeQuantityEls);

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

  if (notFoundForms.length) {
    BSS_B2B.logger.error(
      'The following product forms are rendered on the page but not found in storage',
      notFoundForms
    );
  }
}

export function highlightCart() {
  if (!config.get('cart.highlightElements')) return;

  const cart = BSS_B2B.support.cart;

  cart.items = cart.items ?? {};

  for (const [key, item] of Object.entries(cart.items)) {
    if (!item.target.isConnected || !isHighlighted(item.target))
      delete cart.items[key];
  }

  const cartSelectors = getCartSelectors();

  for (const [cartKey, cartItem] of BSS_B2B.storage.cartStorage.getAll()) {
    const cartItemEl = document.querySelector(
      `[${DOM_ATTRS.CART_ITEM_KEY}="${cartKey}"]`
    );
    if (!cartItemEl?.isConnected) continue;

    const { product_id: productId, variant_id: variantId } = cartItem;

    const availableRules = getAvailableRules({ cartKey });
    const appliedRules = getAppliedRules({ cartKey });

    highlightEls([cartItemEl]);

    const originalPriceEls = [
      ...cartItemEl.querySelectorAll(`[${DOM_ATTRS.CART_ITEM_ORIGINAL_PRICE}]`),
    ];
    highlightEls(originalPriceEls, UI_CONTEXT.PRODUCT_PRICE);
    const finalLinePriceEls = [
      ...cartItemEl.querySelectorAll(`[${DOM_ATTRS.CART_FINAL_LINE_PRICE}]`),
    ];
    highlightEls(finalLinePriceEls, UI_CONTEXT.PRODUCT_PRICE);
    const changeQuantityEls = [
      ...cartItemEl.querySelectorAll(cartSelectors.button_change_quantity),
    ];
    highlightEls(changeQuantityEls);

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

  const subTotalEls = [...BSS_B2B.utils.getSubtotalPriceElement()];
  highlightEls(subTotalEls, UI_CONTEXT.PRODUCT_PRICE);
  cart.subTotalEls = subTotalEls;

  const openMiniCartBtns = [
    ...document.querySelectorAll(cartSelectors.btn_open_mini_cart),
  ];
  highlightEls(openMiniCartBtns);
  cart.openMiniCartBtns = openMiniCartBtns;

  const checkoutEls = [...BSS_B2B.utils.getCheckoutElements()];
  highlightEls(checkoutEls);
  cart.checkoutEls = checkoutEls;

  const addToCartBtns = [
    ...document.querySelectorAll(cartSelectors.btn_add_to_cart),
  ];
  highlightEls(addToCartBtns);
  cart.addToCartBtns = addToCartBtns;
}

export function unhighlightSearch() {
  const search = BSS_B2B.support.search;
  for (const searchBar of Object.values(search)) {
    unhighlightEls([searchBar.target, ...Object.values(searchBar.cards).map(c => c.target)]);
  }
}

export function unhighlightCollection() {
  const collection = BSS_B2B.support.collection;
  for (const card of Object.values(collection)) {
    unhighlightEls([card.target, ...card.priceEls, ...card.quickViewBtns]);
  }
}

export function unhighlightForms() {
  const forms = BSS_B2B.support.forms;
  for (const locationForms of Object.values(forms)) {
    for (const form of Object.values(locationForms)) {
      unhighlightEls([form.target, ...form.priceEls, ...form.changeQuantityEls, ...form.cartForms.map(cf => cf.target)]);
    }
  }
}

export function unhighlightCart() {
  const cart = BSS_B2B.support.cart;
  for (const [key, item] of Object.entries(cart.items)) {
    unhighlightEls([item.target, ...item.originalPriceEls, ...item.finalLinePriceEls, ...item.changeQuantityEls]);
  }
  unhighlightEls([...cart.subTotalEls, ...cart.openMiniCartBtns, ...cart.checkoutEls, ...cart.addToCartBtns]);
}

function setUIContext(el, context) {
  if (!el) return;
  el.setAttribute('data-ui-context', context);
}
