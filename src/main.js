import { bootstrapApp } from './core/bootstrap';

(() => {
  if (!window.Shopify) return;

  const app = bootstrapApp();
  window.addEventListener('bss_b2b:module:loaded', app, { once: true });
})();
