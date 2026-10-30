const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatPrice(price: number): string {
  return currency.format(price);
}

export function formatAvailability(stock: number): string {
  return stock === 0 ? 'Out of stock' : `${stock} in stock`;
}
