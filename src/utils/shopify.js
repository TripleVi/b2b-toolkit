export function getShopifyProductLink(id) {
  const myShopifyDomain = window.Shopify.shop;
  const shop = myShopifyDomain.split('.myshopify.com')[0];
  return `https://admin.shopify.com/store/${shop}/products/${id}`;
}

export function getShopifyVariantLink(productId, variantId) {
  const productLink = getShopifyProductLink(productId);
  return `${productLink}/variants/${variantId}`;
}
