import { bootstrapApp } from './core/bootstrap';

(() => {
  const app = bootstrapApp();
  window.addEventListener('bss_b2b:module:loaded', app, { once: true });
})();
