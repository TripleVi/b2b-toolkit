import { getRuleUrl } from './b2b';
import { getShopifyProductLink, getShopifyVariantLink } from './shopify';

export const UI_CONTEXT = {
  SEARCH: 'search',
  MINI_CART: 'mini_cart',
  MAIN_CART: 'main_cart',
  COLLECTION: 'collection',
  PRODUCT_PAGE: 'product_page',
  QUICK_VIEW: 'quick_view',
  PRODUCT_PRICE: 'product_price',
};

export function upsertStyleTag(content, styleId = 'bss-b2b-style') {
  let styleEl = document.getElementById(styleId);
  if (!(styleEl instanceof HTMLStyleElement)) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = content;
}

export function showBadges(badges) {
  setStyles(badges, { display: 'block' });
}

export function hideBadges(badges) {
  setStyles(badges, { display: 'none' });
}

export function showElementBadges(els) {
  const badgeSelector = '.bss-b2b-badge';
  els.forEach(el => showBadges(el.querySelectorAll(badgeSelector)));
}

export function hideElementBadges(els) {
  const badgeSelector = '.bss-b2b-badge';
  els.forEach(el => hideBadges(el.querySelectorAll(badgeSelector)));
}

export function attachHoverBadge(els, content) {
  els.forEach(el => {
    const badge = document.createElement('div');
    badge.className = 'bss-b2b-badge';
    badge.innerHTML = content;
    badge.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        left: 4px;
        padding: 4px 6px;
        background: white;
        color: black;
        font-size: 12px;
        z-index: 9999;
        border: 1px solid black;
        display: none;
    `;
    badge.onclick = e => e.stopPropagation();

    el.style.position = 'relative';
    el.onmouseenter = () => showBadges(badge);
    el.onmouseleave = () => hideBadges(badge);
    el.appendChild(badge);
  });
  return els;
}

export function replaceStyles(els, styles = {}) {
  const cssText = Object.entries(styles)
    .filter(([_, value]) => value != null && value !== '')
    .map(([prop, value]) => {
      const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      return `${cssProp}: ${value} !important;`;
    })
    .join(' ');

  els.forEach(el => (el.style.cssText = cssText));
  return els;
}

export function setStyles(el, styles = {}) {
  Object.entries(styles).forEach(([prop, value]) => {
    const cssProp = toKebab(prop);
    value
      ? el.style.setProperty(cssProp, value, 'important')
      : el.style.removeProperty(cssProp);
  });
}

function toKebab(str) {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

const elementColors = {
  price: 'red',
  default: '#00f',
};

export function highlightEls(els, uiContext) {
  let borderColor = elementColors.default;
  if (uiContext === UI_CONTEXT.PRODUCT_PRICE) {
    borderColor = elementColors.price;
  }
  els.forEach(el => {
    if (isHighlighted(el)) return;
    setHighlighted(el, true);
    setStyles(el, {
      border: '2px solid',
      position: 'relative',
      borderColor,
    });
  });
}

export function unhighlightEls(els) {
  els.forEach(el => {
    setStyles(el, {
      border: '',
      position: '',
      borderColor: '',
    });
  });
}

export function handleElementBadge({
  container,
  productId,
  variantId,
  appliedRules,
  printInfo,
}) {
  const productLink = getShopifyProductLink(productId);
  const variantLink = getShopifyVariantLink(productId, variantId);

  const rules = [];
  for (const [key, rule] of Object.entries(appliedRules)) {
    const ruleUrl = getRuleUrl(key, rule);
    rules.push(
      `${key.toUpperCase()}: <a href="${ruleUrl}" style="display:inline!important;" target="_blank" rel="noopener noreferrer">${rule.id}</a>`
    );
  }

  attachHoverBadge(
    [container],
    `
        PID: <a href="${productLink}" style="display:inline!important;" target="_blank" rel="noopener noreferrer">${productId}</a> | 
        VID: <a href="${variantLink}" style="display:inline!important;" target="_blank" rel="noopener noreferrer">${variantId}</a> | 
        ${rules.join(' | ')}
        <span class="bss-b2b-badge__action-info" style="cursor:pointer;display:inline!important;">ℹ️</span>
        <span class="bss-b2b-badge__action-close" style="cursor:pointer;display:inline!important;">✖</span>
      `
  );

  const infoBtn = container.querySelector('.bss-b2b-badge__action-info');
  const closeBtn = container.querySelector('.bss-b2b-badge__action-close');
  infoBtn.onclick = printInfo;
  closeBtn.onclick = () => hideElementBadges([container]);
}

export function setHighlighted(el, isHighlighted) {
  el.classList.toggle('highlight', isHighlighted);
}

export function isHighlighted(el) {
  return el.classList.contains('highlight');
}

export function showToast(message) {
  const toast = document.createElement('div');
  toast.innerText = message;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    z-index: 9999;
    font-size: 14px;
    `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
