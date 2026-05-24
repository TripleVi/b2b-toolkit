export function getRuleUrl(key, rule) {
  const { TD_KEY, PL_KEY, CP_KEY, QB_KEY } = BSS_B2B.enum;
  const myShopifyDomain = window.Shopify.shop;
  const shop = myShopifyDomain.split('.myshopify.com')[0];
  const appUrl = `https://admin.shopify.com/store/${shop}/apps/b2b-solution-custom-pricing`;

  switch (key) {
    case PL_KEY:
      return `${appUrl}/b2b-pricing/price-list/${rule.id}`;
    case CP_KEY:
      return `${appUrl}/b2b-pricing/cp/${rule.id}`;
    case QB_KEY:
      return `${appUrl}/b2b-pricing/qb/${rule.id}`;
    case TD_KEY:
      return `${appUrl}/tax-currency-management/tax-display/${rule.id}`;
    default:
      return null;
  }
}

export function getAppliedRules({ productId, formId, cartKey }) {
  const { TD_KEY, PL_KEY, CP_KEY, QB_KEY } = BSS_B2B.enum;
  const rules = {};
  const {
    storage: {
      productStorage,
      productFormStorage,
      variantStorage,
      cartStorage,
    },
  } = BSS_B2B;

  if (productId) {
    const product = productStorage.get(productId);
    const variant = variantStorage.get(product?.currentVariant?.id);
    if (!variant) return rules;

    if (variant.appliedPL) rules[PL_KEY] = variant.appliedPL;
    else if (variant.appliedCP) rules[CP_KEY] = variant.appliedCP;
    if (variant.appliedTD) rules[TD_KEY] = variant.appliedTD;

    return rules;
  } else if (formId) {
    const product = productFormStorage.get(formId);
    const variant = variantStorage.get(product?.currentVariant?.id);
    if (!variant) return rules;

    if (variant.appliedPL) rules[PL_KEY] = variant.appliedPL;
    else if (variant.appliedCP) rules[CP_KEY] = variant.appliedCP;
    if (variant.appliedTD) rules[TD_KEY] = variant.appliedTD;
    return rules;
  } else if (cartKey) {
    const cartItem = cartStorage.get(cartKey);
    const variant = variantStorage.get(cartItem.variant_id);
    if (!variant) return rules;

    if (variant.appliedPL) rules[PL_KEY] = variant.appliedPL;
    else if (variant.appliedCP) rules[CP_KEY] = variant.appliedCP;
    if (variant.appliedTD) rules[TD_KEY] = variant.appliedTD;

    return rules;
  } else {
    return rules;
  }
}

export function getAvailableRules({ productId, formId, cartKey }) {
  const { TD_KEY, PL_KEY, CP_KEY, QB_KEY } = BSS_B2B.enum;
  const {
    cp,
    pl,
    td,
    storage: {
      productStorage,
      productFormStorage,
      variantStorage,
      cartStorage,
    },
  } = BSS_B2B;
  const rules = {};
  let product;

  if (productId) {
    product = productStorage.get(productId);
  } else if (formId) {
    product = productFormStorage.get(formId);
  } else if (cartKey) {
    const cartItem = cartStorage.get(cartKey);
    product = productStorage.get(cartItem?.product_id);
    if (product)
      product.currentVariant = variantStorage.get(cartItem?.variant_id);
  } else {
    return rules;
  }

  if (!variantStorage.has(product?.currentVariant?.id)) return rules;

  if (cp.cpRules?.length) {
    const arr = cp.utils.common
      .getCustomerAppliedRules()
      .filter(rule => cp.utils.common.checkProduct(rule, product));
    if (arr.length) rules[CP_KEY] = arr;
  }
  if (pl.plRules?.length) {
    const arr = pl.utils.common
      .getCustomerAppliedRules()
      .filter(rule => pl.utils.common.checkProduct(rule, product));
    if (arr.length) rules[PL_KEY] = arr;
  }
  if (td.tdRules?.length) {
    const arr = td.utils.common
      .getCustomerAppliedRules()
      .filter(rule => td.utils.common.checkProduct(rule, product));
    if (arr.length) rules[TD_KEY] = arr;
  }

  return rules;
}
