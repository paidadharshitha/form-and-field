/** Keep catalogue context while linking directly to one product on this page. */
export function buildProductLink(
  currentUrl: string,
  productId: number,
): string {
  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw new Error('A product link needs a positive product ID.');
  }
  const url = new URL(currentUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Product links must use HTTP or HTTPS.');
  }
  url.username = '';
  url.password = '';
  url.searchParams.set('product', String(productId));
  url.hash = '';
  return url.toString();
}
