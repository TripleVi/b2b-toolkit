// ==UserScript==
// @name         B2B Toolkit
// @namespace    npm/vite-plugin-monkey
// @version      0.1.0
// @author       TripleVi
// @description  Internal support toolkit for B2B Solution
// @icon         https://vitejs.dev/logo.svg
// @supportURL   https://github.com/TripleVi/b2b-toolkit
// @downloadURL  https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js
// @updateURL    https://triplevi.github.io/b2b-toolkit/b2b-toolkit.user.js
// @match        https://*/*
// @exclude      *://cdn.shopify.com/*
// @exclude      *://shop.app/*
// @exclude      *://*.shop.app/*
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';
	function createStorage(namespace = "app", storage = localStorage) {
		function buildKey(key) {
			return `${namespace}:${key}`;
		}
		function set(key, value, options = {}) {
			const { ttl } = options;
			const data = {
				value,
				expiry: ttl ? Date.now() + ttl : null
			};
			try {
				storage.setItem(buildKey(key), JSON.stringify(data));
				return true;
			} catch (err) {
				console.error("Storage set error:", err);
				return false;
			}
		}
		function get(key) {
			try {
				const raw = storage.getItem(buildKey(key));
				if (!raw) return null;
				const data = JSON.parse(raw);
				if (data.expiry && Date.now() > data.expiry) {
					storage.removeItem(buildKey(key));
					return null;
				}
				return data.value;
			} catch (err) {
				console.error("Storage get error:", err);
				return null;
			}
		}
		function remove(key) {
			storage.removeItem(buildKey(key));
		}
		function clear() {
			Object.keys(storage).forEach((k) => {
				if (k.startsWith(namespace + ":")) storage.removeItem(k);
			});
		}
		function exists(key) {
			return get(key) !== null;
		}
		return {
			set,
			get,
			remove,
			clear,
			exists,
			namespace
		};
	}
	var DEFAULTS$1 = {
		customFn: { enabled: false },
		customSelector: { enabled: false },
		search: {
			color: "#2563EB",
			card: { color: "#60A5FA" },
			price: { color: "#DC2626" },
			quickViewBtn: { color: "#10B981" },
			highlightElements: true
		},
		collection: {
			color: "#16A34A",
			card: { color: "#4ADE80" },
			price: { color: "#DC2626" },
			quickViewBtn: { color: "#10B981" },
			highlightElements: true
		},
		cart: {
			card: { color: "#F97316" },
			originalPrice: { color: "#6B7280" },
			linePrice: { color: "#DC2626" },
			subtotal: { color: "#B91C1C" },
			highlightElements: true
		},
		form: {
			main: {
				color: "#7C3AED",
				price: { color: "#DC2626" }
			},
			quickView: {
				color: "#EC4899",
				price: { color: "#DC2626" }
			},
			featured: {
				color: "#06B6D4",
				price: { color: "#DC2626" }
			},
			quickOrderList: {
				color: "#0D9488",
				price: { color: "#DC2626" }
			},
			highlightElements: true
		}
	};
	function deepMerge$1(target, source) {
		const result = { ...target };
		for (const key of Object.keys(source)) {
			const t = target[key], s = source[key];
			result[key] = s && t && typeof s === "object" && !Array.isArray(s) && typeof t === "object" && !Array.isArray(t) ? deepMerge$1(t, s) : s;
		}
		return result;
	}
	function parsePath(path) {
		return typeof path === "string" ? path.split(".") : [path];
	}
	function getByPath(obj, path) {
		return parsePath(path).reduce((cur, key) => cur != null ? cur[key] : void 0, obj);
	}
	function setByPath(obj, path, value) {
		const keys = parsePath(path);
		const result = { ...obj };
		let cur = result;
		for (let i = 0; i < keys.length - 1; i++) {
			cur[keys[i]] = { ...cur[keys[i]] };
			cur = cur[keys[i]];
		}
		cur[keys[keys.length - 1]] = value;
		return result;
	}
	function validateAndMerge$1(defaults, modified) {
		const result = {};
		for (const key of Object.keys(defaults)) {
			const defVal = defaults[key];
			const modVal = modified?.[key];
			if (modVal === void 0) {
				result[key] = defVal;
				continue;
			}
			const defType = typeof defVal;
			const modType = typeof modVal;
			if (defType === "object" && modType === "object" && !Array.isArray(defVal) && !Array.isArray(modVal) && defVal !== null && modVal !== null) {
				result[key] = validateAndMerge$1(defVal, modVal);
				continue;
			}
			if (defType !== modType) {
				result[key] = defVal;
				continue;
			}
			result[key] = modVal;
		}
		return result;
	}
	function createAppConfig() {
		const storage = createStorage(Shopify.theme.schema_name);
		const STORAGE_KEY = "config";
		const listeners = [];
		const publicConfig = deepMerge$1(DEFAULTS$1, {});
		function _load() {
			return deepMerge$1(DEFAULTS$1, storage.get(STORAGE_KEY) ?? {});
		}
		function get(path) {
			const cfg = _load();
			return path ? getByPath(cfg, path) : cfg;
		}
		function set(path, value) {
			const next = setByPath(_load(), path, value);
			storage.set(STORAGE_KEY, next);
			listeners.forEach((fn) => fn(path, value, next));
		}
		function reset(path) {
			if (!path) {
				storage.remove(STORAGE_KEY);
				Object.assign(publicConfig, deepMerge$1(DEFAULTS$1, {}));
				listeners.forEach((fn) => fn(null, null, { ...DEFAULTS$1 }));
				return;
			}
			const defaultValue = getByPath(DEFAULTS$1, path);
			if (defaultValue !== void 0) set(path, defaultValue);
		}
		function save() {
			const merged = validateAndMerge$1(_load(), publicConfig);
			storage.set(STORAGE_KEY, merged);
			return merged;
		}
		function onChange(fn) {
			listeners.push(fn);
			return () => listeners.splice(listeners.indexOf(fn), 1);
		}
		return {
			publicConfig,
			get,
			set,
			save,
			reset,
			onChange
		};
	}
	var _instance$1 = null;
	function getInstance$1() {
		if (!_instance$1) _instance$1 = createAppConfig();
		return _instance$1;
	}
	var config = {
		get publicConfig() {
			return getInstance$1().publicConfig;
		},
		get(path) {
			return getInstance$1().get(path);
		},
		set(path, value) {
			return getInstance$1().set(path, value);
		},
		save() {
			return getInstance$1().save();
		},
		reset(path) {
			return getInstance$1().reset(path);
		},
		onChange(fn) {
			return getInstance$1().onChange(fn);
		}
	};
	function getRuleUrl(key, rule) {
		const { TD_KEY, PL_KEY, CP_KEY, QB_KEY } = BSS_B2B.enum;
		const appUrl = `https://admin.shopify.com/store/${window.Shopify.shop.split(".myshopify.com")[0]}/apps/b2b-solution-custom-pricing`;
		switch (key) {
			case PL_KEY: return `${appUrl}/b2b-pricing/price-list/${rule.id}`;
			case CP_KEY: return `${appUrl}/b2b-pricing/cp/${rule.id}`;
			case QB_KEY: return `${appUrl}/b2b-pricing/qb/${rule.id}`;
			case TD_KEY: return `${appUrl}/tax-currency-management/tax-display/${rule.id}`;
			default: return null;
		}
	}
	function getAppliedRules({ productId, formId, cartKey }) {
		const { TD_KEY, PL_KEY, CP_KEY, QB_KEY } = BSS_B2B.enum;
		const rules = {};
		const { storage: { productStorage, productFormStorage, variantStorage, cartStorage } } = BSS_B2B;
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
		} else return rules;
	}
	function getAvailableRules({ productId, formId, cartKey }) {
		const { TD_KEY, PL_KEY, CP_KEY, QB_KEY } = BSS_B2B.enum;
		const { cp, pl, td, storage: { productStorage, productFormStorage, variantStorage, cartStorage } } = BSS_B2B;
		const rules = {};
		let product;
		if (productId) product = productStorage.get(productId);
		else if (formId) product = productFormStorage.get(formId);
		else if (cartKey) {
			const cartItem = cartStorage.get(cartKey);
			product = productStorage.get(cartItem?.product_id);
			if (product) product.currentVariant = variantStorage.get(cartItem?.variant_id);
		} else return rules;
		if (!variantStorage.has(product?.currentVariant?.id)) return rules;
		if (cp.cpRules?.length) {
			const arr = cp.utils.common.getCustomerAppliedRules().filter((rule) => cp.utils.common.checkProduct(rule, product));
			if (arr.length) rules[CP_KEY] = arr;
		}
		if (pl.plRules?.length) {
			const arr = pl.utils.common.getCustomerAppliedRules().filter((rule) => pl.utils.common.checkProduct(rule, product));
			if (arr.length) rules[PL_KEY] = arr;
		}
		if (td.tdRules?.length) {
			const arr = td.utils.common.getCustomerAppliedRules().filter((rule) => td.utils.common.checkProduct(rule, product));
			if (arr.length) rules[TD_KEY] = arr;
		}
		return rules;
	}
	function validateCustomFn(fn) {
		if (typeof fn !== "function") throw new TypeError("Expected a function as argument");
		if (fn.name === "") throw new Error("Function must have a name");
		if (fn.name in window) {
			if (typeof window[fn.name] === "function") throw new Error(`Function "${fn.name}" already exists on global scope`);
			throw new Error(`Global name "${fn.name}" is already in use`);
		}
		const str = fn.toString();
		if (!str.endsWith("}")) throw new Error("Function must use a block body `{}` (no implicit return)");
		return str.slice(str.indexOf("{") + 1, str.lastIndexOf("}"));
	}
	function getParams(fn) {
		const argsStr = fn.toString().match(/\(([\s\S]*?)\)/)?.[1] || "";
		const params = [];
		let current = "";
		let depth = 0;
		let inString = false;
		let stringChar = "";
		for (let i = 0; i < argsStr.length; i++) {
			const char = argsStr[i];
			if (inString) {
				current += char;
				if (char === stringChar && argsStr[i - 1] !== "\\") inString = false;
				continue;
			}
			if (char === "\"" || char === "'" || char === "`") {
				inString = true;
				stringChar = char;
				current += char;
				continue;
			}
			if (char === "(" || char === "{" || char === "[") depth++;
			if (char === ")" || char === "}" || char === "]") depth--;
			if (char === "," && depth === 0) {
				params.push(current.trim());
				current = "";
				continue;
			}
			current += char;
		}
		if (current.trim()) params.push(current.trim());
		return params;
	}
	function getCustomFns$1(key) {
		const storage = createStorage(Shopify.theme.schema_name);
		return new Map(storage.get(key) ?? []);
	}
	function saveCustomFns(key, customFns) {
		createStorage(Shopify.theme.schema_name).set(key, [...customFns]);
	}
	function removeCustomFn(key, name) {
		const customFns = getCustomFns$1(key);
		if (customFns.delete(name)) {
			saveCustomFns(key, customFns);
			return true;
		}
		return false;
	}
	var RUNNABLE_KEY = "runnableFns";
	var REGISTERED_KEY = "registeredFns";
	function addRunnableFn(fn) {
		const body = validateCustomFn(fn);
		const customFns = getCustomFns$1(RUNNABLE_KEY);
		customFns.set(fn.name, body);
		saveCustomFns(RUNNABLE_KEY, customFns);
	}
	function registerFn(fn) {
		const body = validateCustomFn(fn);
		const params = getParams(fn);
		const customFns = getCustomFns$1(REGISTERED_KEY);
		customFns.set(fn.name, {
			params,
			body
		});
		saveCustomFns(REGISTERED_KEY, customFns);
	}
	function getRunnableFns(key) {
		return getCustomFns$1(RUNNABLE_KEY);
	}
	function getRegisteredFns(key) {
		return getCustomFns$1(REGISTERED_KEY);
	}
	function removeRunnableFn(name) {
		return removeCustomFn(RUNNABLE_KEY, name);
	}
	function removeRegisteredFn(name) {
		return removeCustomFn(REGISTERED_KEY, name);
	}
	function execute() {
		getRegisteredFns().forEach(({ params, body }, name) => {
			if (window[name]) {
				console.warn(`Skipping registration of function "${name}" as it already exists on global scope`);
				return;
			}
			window[name] = new Function(...params, body);
		});
		getRunnableFns().forEach((body) => {
			new Function(body)();
		});
	}
	function isEnabled() {
		return !!config.get("customFn.enabled");
	}
	function isDisabled() {
		return !isEnabled();
	}
	function enable() {
		config.set("customFn.enabled", true);
	}
	function disable() {
		config.reset("customFn.enabled");
	}
	var customFunctions_default = {
		addRunnableFn,
		registerFn,
		getRunnableFns,
		getRegisteredFns,
		removeRunnableFn,
		removeRegisteredFn,
		execute,
		isEnabled,
		isDisabled,
		enable,
		disable
	};
	var DEFAULTS = {
		collection: {
			selectorCard: ":not(*)",
			selectorPrice: ":not(*)",
			selectorQuickviewBtn: ":not(*)",
			selectorSearchBar: ":not(*)"
		},
		product: {
			selectorForm: ":not(*)",
			selectorPrice: ":not(*)"
		},
		miniCart: {
			selectorCard: ":not(*)",
			selectorOriginPrice: ":not(*)",
			selectorFinalLinePrice: ":not(*)",
			selectorSubtotalPrice: ":not(*)"
		},
		cart: {
			selectorCard: ":not(*)",
			selectorOriginPrice: ":not(*)",
			selectorFinalLinePrice: ":not(*)",
			selectorSubtotalPrice: ":not(*)"
		},
		quickView: {
			selectorCard: ":not(*)",
			selectorPrice: ":not(*)"
		},
		searchBar: {
			selectorCard: ":not(*)",
			selectorPrice: ":not(*)"
		}
	};
	function deepMerge(target, source) {
		const result = { ...target };
		for (const key of Object.keys(source)) {
			const t = target[key], s = source[key];
			result[key] = s && t && typeof s === "object" && !Array.isArray(s) && typeof t === "object" && !Array.isArray(t) ? deepMerge(t, s) : s;
		}
		return result;
	}
	function validateAndMerge(defaults, modified) {
		const result = {};
		for (const key of Object.keys(defaults)) {
			const defVal = defaults[key];
			const modVal = modified?.[key];
			if (modVal === void 0) {
				result[key] = defVal;
				continue;
			}
			const defType = typeof defVal;
			const modType = typeof modVal;
			if (defType === "object" && modType === "object" && !Array.isArray(defVal) && !Array.isArray(modVal) && defVal !== null && modVal !== null) {
				result[key] = validateAndMerge(defVal, modVal);
				continue;
			}
			if (defType !== modType) {
				result[key] = defVal;
				continue;
			}
			result[key] = modVal;
		}
		return result;
	}
	function createCustomSelectors() {
		const STORAGE_KEY = "customSelectors";
		const storage = createStorage(Shopify.theme.schema_name);
		const tag = "custom:config_theme/installation";
		const addFilter = BSS_B2B.addFilter ?? BSS_B2B.custom.addFilter;
		let publicSelectors;
		function init() {
			if (bssB2BHooks.filters[tag]) delete bssB2BHooks.filters[tag];
			if (!hasData()) {
				publicSelectors = deepMerge(DEFAULTS, {});
				storage.set(STORAGE_KEY, publicSelectors);
			} else publicSelectors = get();
			addFilter(tag, (config, { page }) => {
				return get()[page] ?? config;
			});
			config.set("customSelector.enabled", true);
			return publicSelectors;
		}
		function _load() {
			return deepMerge(DEFAULTS, storage.get(STORAGE_KEY) ?? {});
		}
		function get() {
			return storage.get(STORAGE_KEY);
		}
		function hasData() {
			return !!get();
		}
		function isEnabled() {
			return config.get("customSelector.enabled");
		}
		function isDisabled() {
			return !isEnabled();
		}
		function save() {
			const merged = validateAndMerge(_load(), publicSelectors);
			storage.set(STORAGE_KEY, merged);
			publicSelectors = merged;
			return merged;
		}
		function enable() {
			config.set("customSelector.enabled", true);
		}
		function disable() {
			config.reset("customSelector.enabled");
		}
		return {
			get values() {
				return publicSelectors;
			},
			init,
			save,
			enable,
			disable,
			hasData,
			isEnabled,
			isDisabled
		};
	}
	var _instance = null;
	function getInstance() {
		if (!_instance) _instance = createCustomSelectors();
		return _instance;
	}
	var customSelector = {
		get values() {
			return getInstance().values;
		},
		init: () => getInstance().init(),
		save: () => getInstance().save(),
		enable: () => getInstance().enable(),
		disable: () => getInstance().disable(),
		hasData: () => getInstance().hasData(),
		isEnabled: () => getInstance().isEnabled(),
		isDisabled: () => getInstance().isDisabled()
	};
	function generateCode() {
		const runnableFns = getCustomFns("runnableFns");
		const fns = [];
		runnableFns.forEach((body, name) => {
			const fn = new Function(body);
			const str = fn.toString().replace("function anonymous", `function ${name}`);
			fns.push(`
        ${str}
        ${name}();
      `);
			fn();
		});
		return `
      const customSelectors = ${JSON.stringify(BSS_B2B.support.customSelector.values)};
      function configTheme(config, { page }) {
        return customSelectors[page] ?? config;
      }
      BSS_B2B.addFilter('custom:config_theme/installation', configTheme);
      ${fns.join()}
    `;
	}
	var DOM_ATTRS = {
		PRODUCT_ID: "bss-b2b-product-id",
		PRODUCT_PRICE: "bss-b2b-product-price",
		PRODUCT_QB_ID: "bss-b2b-product-qb-id",
		VARIANT_ID: "bss-b2b-variant-id",
		VARIANT_PRICE: "bss-b2b-variant-price",
		COLLECTION_ELEMENT: "bss-b2b-collection-element",
		MAIN_PRODUCT_FORM: "bss-b2b-main-product-form",
		PRODUCT_FORM: "bss-b2b-product-form",
		PRODUCT_FORM_ID: "bss-b2b-product-form-id",
		QUICKVIEW_BTN: "bss-b2b-quickview-btn",
		SEARCHBAR_OBSERVER_ID: "bss-b2b-searchbar-observer-id",
		CART_ITEM_KEY: "bss-b2b-cart-item-key",
		CART_ITEM_ORIGINAL_PRICE: "bss-b2b-item-original-price",
		CART_FINAL_LINE_PRICE: "bss-b2b-final-line-price"
	};
	var UI_CONTEXT = {
		SEARCH: "search",
		MINI_CART: "mini_cart",
		MAIN_CART: "main_cart",
		COLLECTION: "collection",
		PRODUCT_PAGE: "product_page",
		QUICK_VIEW: "quick_view",
		PRODUCT_PRICE: "product_price"
	};
	function getProductSelectors() {
		return BSS_B2B.utils.SelectorsFactory.getSelectors("ProductSelectors").getSelectors();
	}
	function getCartSelectors() {
		return BSS_B2B.utils.SelectorsFactory.getSelectors("CartSelectors").getSelectors();
	}
	function getShopifyProductLink(id) {
		return `https://admin.shopify.com/store/${window.Shopify.shop.split(".myshopify.com")[0]}/products/${id}`;
	}
	function getShopifyVariantLink(productId, variantId) {
		return `${getShopifyProductLink(productId)}/variants/${variantId}`;
	}
	function upsertStyleTag(content, styleId = "bss-b2b-style") {
		let styleEl = document.getElementById(styleId);
		if (!(styleEl instanceof HTMLStyleElement)) {
			styleEl = document.createElement("style");
			styleEl.id = styleId;
			document.head.appendChild(styleEl);
		}
		styleEl.textContent = content;
	}
	function showBadges(badges) {
		setStyles(badges, { display: "block" });
	}
	function hideBadges(badges) {
		setStyles(badges, { display: "none" });
	}
	function hideElementBadges(els) {
		const badgeSelector = ".bss-b2b-badge";
		els.forEach((el) => hideBadges(el.querySelectorAll(badgeSelector)));
	}
	function attachHoverBadge(els, content) {
		els.forEach((el) => {
			const badge = document.createElement("div");
			badge.className = "bss-b2b-badge";
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
			badge.onclick = (e) => e.stopPropagation();
			el.style.position = "relative";
			el.onmouseenter = () => showBadges(badge);
			el.onmouseleave = () => hideBadges(badge);
			el.appendChild(badge);
		});
		return els;
	}
	function setStyles(el, styles = {}) {
		Object.entries(styles).forEach(([prop, value]) => {
			const cssProp = toKebab(prop);
			value ? el.style.setProperty(cssProp, value, "important") : el.style.removeProperty(cssProp);
		});
	}
	function toKebab(str) {
		return str.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
	}
	var elementColors = {
		price: "red",
		default: "#00f"
	};
	function highlightEls(els, uiContext) {
		const borderColor = config.get(uiContext + ".color") ?? elementColors.default;
		els.forEach((el) => {
			if (isHighlighted(el)) return;
			setHighlighted(el, true);
			setStyles(el, {
				border: "2px solid",
				position: "relative",
				borderColor
			});
		});
	}
	function unhighlightEls(els) {
		els.forEach((el) => {
			setStyles(el, {
				border: "",
				position: "",
				borderColor: ""
			});
		});
	}
	function handleElementBadge({ container, productId, variantId, appliedRules, printInfo }) {
		const productLink = getShopifyProductLink(productId);
		const variantLink = getShopifyVariantLink(productId, variantId);
		const rules = [];
		for (const [key, rule] of Object.entries(appliedRules)) {
			const ruleUrl = getRuleUrl(key, rule);
			rules.push(`${key.toUpperCase()}: <a href="${ruleUrl}" style="display:inline!important;" target="_blank" rel="noopener noreferrer">${rule.id}</a>`);
		}
		attachHoverBadge([container], `
        PID: <a href="${productLink}" style="display:inline!important;" target="_blank" rel="noopener noreferrer">${productId}</a> | 
        VID: <a href="${variantLink}" style="display:inline!important;" target="_blank" rel="noopener noreferrer">${variantId}</a> | 
        ${rules.join(" | ")}
        <span class="bss-b2b-badge__action-info" style="cursor:pointer;display:inline!important;">ℹ️</span>
        <span class="bss-b2b-badge__action-close" style="cursor:pointer;display:inline!important;">✖</span>
      `);
		const infoBtn = container.querySelector(".bss-b2b-badge__action-info");
		const closeBtn = container.querySelector(".bss-b2b-badge__action-close");
		infoBtn.onclick = printInfo;
		closeBtn.onclick = () => hideElementBadges([container]);
	}
	function setHighlighted(el, isHighlighted) {
		el.classList.toggle("highlight", isHighlighted);
	}
	function isHighlighted(el) {
		return el.classList.contains("highlight");
	}
	function showToast(message) {
		const toast = document.createElement("div");
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
			toast.style.opacity = "1";
			toast.style.transform = "translateX(-50%) translateY(0)";
		});
		setTimeout(() => {
			toast.style.opacity = "0";
			toast.style.transform = "translateX(-50%) translateY(-10px)";
			setTimeout(() => toast.remove(), 300);
		}, 2500);
	}
	function handleSearch() {
		document.querySelectorAll(`[${DOM_ATTRS.SEARCHBAR_OBSERVER_ID}]`).forEach((container) => {
			const searchId = container.getAttribute(DOM_ATTRS.SEARCHBAR_OBSERVER_ID);
			const searchBar = BSS_B2B.support.search[searchId] ?? {
				target: container,
				cards: {}
			};
			for (const [key, card] of Object.entries(searchBar.cards)) {
				if (card.target.isConnected && isHandled(card.target)) continue;
				delete searchBar.cards[key];
			}
			const cards = handleProductCards({
				cardEls: queryUnhandled(`[${DOM_ATTRS.PRODUCT_QB_ID}]`, container),
				uiContext: UI_CONTEXT.SEARCH
			});
			searchBar.cards = {
				...searchBar.cards,
				...cards
			};
			BSS_B2B.support.search[searchId] = searchBar;
		});
		if (config.get("search.highlightElements")) highlightSearch();
	}
	function handleCollection() {
		const collection = BSS_B2B.support.collection;
		for (const [key, card] of Object.entries(collection)) {
			if (card.target.isConnected && isHandled(card.target)) continue;
			delete collection[key];
		}
		const cards = handleProductCards({
			cardEls: queryUnhandled(`[${DOM_ATTRS.PRODUCT_QB_ID}]`),
			uiContext: UI_CONTEXT.COLLECTION
		});
		BSS_B2B.support.collection = {
			...collection,
			...cards
		};
		if (config.get("collection.highlightElements")) highlightCollection();
	}
	function handleProductCards({ cardEls, uiContext }) {
		const cards = {};
		const notFoundProducts = [];
		cardEls.forEach((cardEl) => {
			if (!cardEl.isConnected || isHandled(cardEl)) return;
			markAsHandled(cardEl);
			const id = +cardEl.getAttribute(DOM_ATTRS.PRODUCT_QB_ID);
			const product = BSS_B2B.storage.productStorage.get(id);
			if (!product) {
				notFoundProducts.push({
					id,
					target: cardEl
				});
				return;
			}
			setUIContext(cardEl, uiContext);
			const priceEls = [...cardEl.querySelectorAll(`[${DOM_ATTRS.PRODUCT_PRICE}][${DOM_ATTRS.PRODUCT_ID}="${id}"]`)];
			let currVariantId = product?.currentVariant?.id;
			if (!currVariantId && priceEls.length) currVariantId = +priceEls[0].getAttribute(DOM_ATTRS.VARIANT_ID);
			if (!currVariantId) currVariantId = product.variants[0].id;
			const currVariant = BSS_B2B.storage.variantStorage.get(currVariantId);
			const availableRules = getAvailableRules({ productId: id });
			const appliedRules = getAppliedRules({ productId: id });
			cards[currVariantId] = {
				target: cardEl,
				product,
				currVariant,
				quickViewBtns: [...cardEl.querySelectorAll(`[${DOM_ATTRS.QUICKVIEW_BTN}]`)],
				appliedRules,
				availableRules,
				priceEls
			};
			handleElementBadge({
				container: cardEl,
				productId: product.id,
				variantId: currVariantId,
				appliedRules,
				printInfo: () => console.log(cards[currVariantId])
			});
		});
		if (notFoundProducts.length) BSS_B2B.logger.error("The following products are rendered on the page but not found in storage", notFoundProducts);
		return cards;
	}
	function handleForms(formIds) {
		const forms = BSS_B2B.support.forms;
		const productSelectors = getProductSelectors();
		for (const [location, locationForms] of Object.entries(forms)) for (const [formId, locationForm] of Object.entries(locationForms)) if (!locationForm.target.isConnected || !isHandled(locationForm.target)) delete locationForms[formId];
		const notFoundForms = [];
		formIds = formIds ?? BSS_B2B.storage.productFormStorage.store.keys().toArray();
		formIds.forEach((formId) => {
			const formEl = document.querySelector(`[${DOM_ATTRS.PRODUCT_FORM_ID}="${formId}"]`);
			if (!formEl?.isConnected) return;
			markAsHandled(formEl);
			const productForm = BSS_B2B.storage.productFormStorage.get(formId);
			if (!productForm) {
				notFoundForms.push({
					formId,
					target: formEl
				});
				return;
			}
			const currVariantId = productForm.currentVariant?.id;
			if (!BSS_B2B.storage.variantStorage.get(currVariantId)) BSS_B2B.logger.error(`Variant with id ${currVariantId} for form ${formId} not found in storage`, {
				formId,
				variantId: currVariantId,
				formEl
			});
			let location;
			switch (productForm.location) {
				case "quickview":
					location = "quickView";
					break;
				case "feature":
					location = "featured";
					break;
				case "quick_order_list":
					location = "quickOrderList";
					break;
				default: location = "main";
			}
			const availableRules = getAvailableRules({ formId });
			const appliedRules = getAppliedRules({ formId });
			handleElementBadge({
				container: formEl,
				productId: productForm.id,
				variantId: currVariantId,
				appliedRules,
				printInfo: () => console.log(BSS_B2B.support.forms[location][formId])
			});
			const priceEls = [...formEl.querySelectorAll(`[${DOM_ATTRS.VARIANT_PRICE}]`)];
			const cartForms = [...formEl.querySelectorAll(productSelectors.product_cart_form)].map((cartFormEl) => {
				return {
					target: cartFormEl,
					variantInputs: [...cartFormEl.querySelectorAll(productSelectors.variant_input)].map((variantInputEl) => {
						const variantId = +variantInputEl.value;
						return {
							target: variantInputEl,
							variantId,
							variant: BSS_B2B.storage.variantStorage.get(variantId)
						};
					})
				};
			});
			const changeQuantityEls = [...formEl.querySelectorAll([
				productSelectors.btn_up_quantity,
				productSelectors.btn_down_quantity,
				productSelectors.button_change_quantity
			].join(`,`))];
			BSS_B2B.support.forms[location] = BSS_B2B.support.forms[location] ?? {};
			BSS_B2B.support.forms[location][formId] = {
				target: formEl,
				details: productForm,
				priceEls,
				cartForms,
				changeQuantityEls,
				appliedRules,
				availableRules
			};
		});
		if (config.get("form.highlightElements")) highlightForms();
		if (notFoundForms.length) BSS_B2B.logger.error("The following product forms are rendered on the page but not found in storage", notFoundForms);
	}
	function handleCart() {
		const cart = BSS_B2B.support.cart;
		cart.items = cart.items ?? {};
		for (const [key, item] of Object.entries(cart.items)) if (!item.target.isConnected || !isHandled(item.target)) delete cart.items[key];
		const cartSelectors = getCartSelectors();
		for (const [cartKey, cartItem] of BSS_B2B.storage.cartStorage.getAll()) {
			const cartItemEl = document.querySelector(`[${DOM_ATTRS.CART_ITEM_KEY}="${cartKey}"]`);
			if (!cartItemEl?.isConnected) continue;
			markAsHandled(cartItemEl);
			const { product_id: productId, variant_id: variantId } = cartItem;
			const availableRules = getAvailableRules({ cartKey });
			const appliedRules = getAppliedRules({ cartKey });
			const originalPriceEls = [...cartItemEl.querySelectorAll(`[${DOM_ATTRS.CART_ITEM_ORIGINAL_PRICE}]`)];
			const finalLinePriceEls = [...cartItemEl.querySelectorAll(`[${DOM_ATTRS.CART_FINAL_LINE_PRICE}]`)];
			const changeQuantityEls = [...cartItemEl.querySelectorAll(cartSelectors.button_change_quantity)];
			cart.items[cartKey] = {
				target: cartItemEl,
				originalPriceEls,
				finalLinePriceEls,
				details: cartItem,
				product: BSS_B2B.storage.productStorage.get(productId),
				variant: BSS_B2B.storage.variantStorage.get(variantId),
				changeQuantityEls,
				appliedRules,
				availableRules
			};
			handleElementBadge({
				container: cartItemEl,
				productId,
				variantId,
				appliedRules,
				printInfo: () => console.log(cart.items[cartKey])
			});
		}
		cart.subTotalEls = [...BSS_B2B.utils.getSubtotalPriceElement()];
		cart.openMiniCartBtns = [...document.querySelectorAll(cartSelectors.btn_open_mini_cart)];
		cart.checkoutEls = [...BSS_B2B.utils.getCheckoutElements()];
		cart.addToCartBtns = [...document.querySelectorAll(cartSelectors.btn_add_to_cart)];
		if (config.get("cart.highlightElements")) highlightCart();
	}
	function highlightSearch(force = false) {
		config.set("search.highlightElements", true);
		for (const searchBar of Object.values(BSS_B2B.support.search)) {
			const cards = Object.values(searchBar.cards);
			highlightEls([searchBar.target], "search");
			highlightEls(cards.map((c) => c.target), "search.card");
			highlightEls(cards.flatMap((c) => c.priceEls), "search.price");
			highlightEls(cards.flatMap((c) => c.quickViewBtns), "search.quickViewBtn");
		}
	}
	function unhighlightSearch(force = false) {
		config.set("search.highlightElements", false);
		for (const searchBar of Object.values(BSS_B2B.support.search)) {
			const cards = Object.values(searchBar.cards);
			unhighlightEls([
				searchBar.target,
				...cards.map((c) => c.target),
				...cards.flatMap((c) => c.priceEls),
				...cards.flatMap((c) => c.quickViewBtns)
			]);
		}
	}
	function highlightCollection(force = false) {
		config.set("collection.highlightElements", true);
		for (const card of Object.values(BSS_B2B.support.collection)) {
			highlightEls([card.target], "collection.card");
			highlightEls(card.priceEls, "collection.price");
			highlightEls(card.quickViewBtns, "collection.quickViewBtn");
		}
	}
	function unhighlightCollection(force = false) {
		config.set("collection.highlightElements", false);
		for (const card of Object.values(BSS_B2B.support.collection)) unhighlightEls([
			card.target,
			...card.priceEls,
			...card.quickViewBtns
		]);
	}
	function highlightForms(force = false) {
		config.set("form.highlightElements", true);
		for (const [location, locationForms] of Object.entries(BSS_B2B.support.forms)) for (const form of Object.values(locationForms)) {
			highlightEls([form.target], `form.${location}`);
			highlightEls(form.priceEls, `form.${location}.price`);
			highlightEls(form.changeQuantityEls, `form.${location}.changeQuantity`);
			highlightEls(form.cartForms.map((cf) => cf.target), `form.${location}.cartForm`);
		}
	}
	function unhighlightForms(force = false) {
		config.set("form.highlightElements", false);
		for (const locationForms of Object.values(BSS_B2B.support.forms)) for (const form of Object.values(locationForms)) unhighlightEls([
			form.target,
			...form.priceEls,
			...form.changeQuantityEls,
			...form.cartForms.map((cf) => cf.target)
		]);
	}
	function highlightCart(force = false) {
		config.set("cart.highlightElements", true);
		const cart = BSS_B2B.support.cart;
		for (const item of Object.values(cart.items)) {
			highlightEls([item.target], "cart.card");
			highlightEls(item.originalPriceEls, "cart.originalPrice");
			highlightEls(item.finalLinePriceEls, "cart.linePrice");
			highlightEls(item.changeQuantityEls, "cart.changeQuantity");
		}
		highlightEls(cart.subTotalEls, "cart.subtotal");
		highlightEls([
			...cart.openMiniCartBtns,
			...cart.checkoutEls,
			...cart.addToCartBtns
		]);
	}
	function unhighlightCart(force = false) {
		config.set("cart.highlightElements", false);
		const cart = BSS_B2B.support.cart;
		for (const [key, item] of Object.entries(cart.items)) unhighlightEls([
			item.target,
			...item.originalPriceEls,
			...item.finalLinePriceEls,
			...item.changeQuantityEls
		]);
		unhighlightEls([
			...cart.subTotalEls,
			...cart.openMiniCartBtns,
			...cart.checkoutEls,
			...cart.addToCartBtns
		]);
	}
	var HANDLED_ATTR = "handled";
	function markAsHandled(el) {
		el.dataset[HANDLED_ATTR] = "true";
	}
	function isHandled(el) {
		return el.dataset[HANDLED_ATTR] === "true";
	}
	function queryUnhandled(selector, root = document) {
		return root.querySelectorAll(`${selector}:not([data-handled="true"])`);
	}
	function setUIContext(el, context) {
		if (!el) return;
		el.setAttribute("data-ui-context", context);
	}
	function initEventTracker() {
		const MIN_HOOK_PRIORITY = 999999999;
		const MAX_HOOK_PRIORITY = -999999999;
		const { productObserver, cartObserver } = BSS_B2B.observer;
		productObserver.usePre("QuickviewLoaded", (ctx, next) => {
			getQuickViewInfo(ctx.payload.event);
			next();
		});
		productObserver.takeLatest("QuickviewLoaded", (ctx) => {
			handleForms(ctx.payload.formIdMapProducts.keys().toArray());
			BSS_B2B.logger.log("Quick view loaded", { ctx });
		}, { priority: MAX_HOOK_PRIORITY });
		productObserver.usePre("SearchBarLoaded", (ctx, next) => {
			BSS_B2B.logger.log("handle search bar", { ctx });
			next();
		});
		productObserver.takeEvery("SearchBarLoaded", (ctx) => {
			const { notExistProductIds } = ctx.payload;
			handleSearch();
			BSS_B2B.logger.log("Search bar loaded", { notExistProductIds });
		}, { priority: MIN_HOOK_PRIORITY });
		productObserver.takeLatest("VariantChange", (ctx) => {
			const { formId, currentVariant } = ctx.payload;
			showToast(`${ctx.topic}: ${currentVariant.id}`);
			handleForms([formId]);
		}, { priority: MIN_HOOK_PRIORITY });
		productObserver.takeEvery("LoadedLazyProduct", () => {
			handleSearch();
			handleCollection();
			BSS_B2B.logger.log("process LoadedLazyProduct");
		}, { priority: MIN_HOOK_PRIORITY });
		cartObserver.takeLatest("CartUpdate", () => {
			handleCart();
		}, { priority: MIN_HOOK_PRIORITY });
	}
	function getQuickViewInfo(event) {
		const tag = "QuickView";
		const target = event.target;
		if (!(target instanceof HTMLElement)) {
			console.info(`[${tag}] Start loading quick view`, { event });
			return;
		}
		let productId;
		const priceEl = target.querySelector(`[${DOM_ATTRS.PRODUCT_ID}][${DOM_ATTRS.VARIANT_PRICE}]`);
		if (priceEl) productId = priceEl.getAttribute(DOM_ATTRS.PRODUCT_ID);
		else {
			const productCache = BSS_B2B.productMap;
			const collectionProducts = ShopifyAnalytics.meta.products ?? [];
			const handle = (target.querySelector("a[href*=\"/products/\"]")?.getAttribute("href"))?.split("/products/")[1]?.split("?")[0];
			productId = ((handle && collectionProducts.find((p) => p.handle === handle)) ?? productCache.get(handle))?.id;
		}
		if (productId) {
			BSS_B2B.logger.log(`[${tag}][PID: ${productId}] Start loading quick view`);
			return;
		}
		BSS_B2B.logger.error("[QuickView] No product available for form", { event });
	}
	function processProductList() {
		window.dispatchEvent(new Event("scroll"));
	}
	function processForms() {
		BSS_B2B.observer.productSubject.notifyObserver("ProductMutate", "ProductPriceMutate", {
			scope: "product_form",
			reload: true
		});
	}
	function processCart() {
		document.dispatchEvent(new Event("bss_b2b:CustomCartUpdate"));
	}
	function bootstrapApp() {
		window.bssB2BHooks = window.bssB2BHooks ?? {
			actions: {},
			filters: {}
		};
		window.BSS_B2B = window.BSS_B2B ?? {};
		BSS_B2B.addAction = (tag, callback) => bssB2BHooks.actions[tag] = callback;
		BSS_B2B.addFilter = (tag, callback) => bssB2BHooks.filters[tag] = callback;
		const shopStorage = createStorage(Shopify.theme.schema_name);
		if (customFunctions_default.isEnabled()) customFunctions_default.execute();
		if (customSelector.isEnabled()) customSelector.init();
		BSS_B2B.support = {
			collection: {},
			search: {},
			forms: {},
			cart: {},
			utils: {},
			shopStorage,
			configs: {
				values: config.publicConfig,
				save() {
					return config.save();
				}
			},
			customSelector,
			customFn: customFunctions_default
		};
		Object.assign(BSS_B2B.support.utils, {
			processProductList,
			processCart,
			processForms,
			getShopifyProductLink,
			getShopifyVariantLink,
			getAvailableRules,
			getAppliedRules,
			generateCode,
			upsertStyleTag,
			highlightSearch,
			highlightCollection,
			highlightForms,
			highlightCart,
			unhighlightSearch,
			unhighlightCollection,
			unhighlightForms,
			unhighlightCart
		});
		console.log("%c 🛠️ B2B Toolkit v1.0.0 %c by LV ✨", `
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 10px 0 0 10px;
    font-size: 14px;
    font-weight: 700;
  `, `
    background: #111827;
    color: #93c5fd;
    padding: 8px 8px;
    border-radius: 0 10px 10px 0;
    font-size: 13px;
    font-weight: 600;
  `);
		return () => {
			initEventTracker();
			handleSearch();
			handleCollection();
			handleCart();
			handleForms();
		};
	}
	function onB2bReady() {
		if (!window.Shopify) return;
		const app = bootstrapApp();
		window.addEventListener("bss_b2b:module:loaded", app, { once: true });
	}
	if (window.bssB2BHooks !== void 0) onB2bReady();
	else Object.defineProperty(window, "bssB2BHooks", {
		configurable: true,
		set(value) {
			Object.defineProperty(window, "bssB2BHooks", {
				value,
				writable: true,
				configurable: true,
				enumerable: true
			});
			setTimeout(onB2bReady);
		},
		get() {}
	});
})();
