import bootstrapApp from './core/bootstrap';
import { initDevMode } from './utils/support';

function onB2bReady() {
  if (!window.Shopify) return;
  const app = bootstrapApp();
  window.addEventListener('bss_b2b:module:loaded', app, { once: true });
}

function process() {
  window.BSS_B2B = window.BSS_B2B ?? {};
  const devMode = initDevMode();
  window.BSS_B2B.support = { utils: { ...devMode } };
}

if (window.bssB2BHooks !== undefined) {
  process();
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

      process();
      setTimeout(onB2bReady);
    },

    get() {
      return undefined;
    },
  });
}
