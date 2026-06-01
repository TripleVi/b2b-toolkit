export function processProductCards() {
  window.dispatchEvent(new Event('scroll'));
}

export function processForms() {
  BSS_B2B.observer.productSubject.notifyObserver(
    'ProductMutate',
    'ProductPriceMutate',
    {
      scope: 'product_form',
      reload: true,
    }
  );
}

export function processCart() {
  document.dispatchEvent(new Event('bss_b2b:CustomCartUpdate'));
}
