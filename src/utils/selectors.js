export function getCustomSelectors(page) {
  return (
    BSS_B2B.custom.executeFilter(
      'custom:config_theme/installation',
      {},
      { page },
      false
    ) ?? BSS_B2B.support.customSelectors[page]
  );
}

export function getCollectionSelectors() {
  return BSS_B2B.utils.SelectorsFactory.getSelectors(
    'ProductListSelectors'
  ).getSelectors();
}

export function getProductSelectors() {
  return BSS_B2B.utils.SelectorsFactory.getSelectors(
    'ProductSelectors'
  ).getSelectors();
}

export function getCartSelectors() {
  return BSS_B2B.utils.SelectorsFactory.getSelectors(
    'CartSelectors'
  ).getSelectors();
}
