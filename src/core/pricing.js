export function processProductCards() {
  window.dispatchEvent(new Event('scroll'));
}

export function processForm() {
  window.dispatchEvent(new Event('scroll'));
}

export function processCart() {
  document.dispatchEvent(new Event('bss_b2b:CustomCartUpdate'));
}
