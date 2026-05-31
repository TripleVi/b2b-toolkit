import bootstrapApp from './core/bootstrap';

function onB2bReady() {
  if (!window.Shopify) return;
  const app = bootstrapApp();
  window.addEventListener('bss_b2b:module:loaded', app, { once: true });
}

if (window.bssB2BHooks !== undefined) {
  onB2bReady();
} else {
  Object.defineProperty(window, 'bssB2BHooks', {
    configurable: true,

    set(value) {
      Object.defineProperty(window, 'bssB2BHooks', {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      setTimeout(onB2bReady);
    },

    get() {
      return undefined;
    },
  });
}
