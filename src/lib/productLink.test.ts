import { describe, expect, it } from 'vitest';
import { buildProductLink } from './productLink';

describe('buildProductLink', () => {
  it('preserves the deployment path, filters, and unrelated query values', () => {
    const link = new URL(
      buildProductLink(
        'https://example.com/form-and-field/?q=lip+stick&category=beauty&min=2&max=40&brand=A%26B&sort=price-asc&campaign=autumn#catalogue',
        12,
      ),
    );
    expect(link.origin).toBe('https://example.com');
    expect(link.pathname).toBe('/form-and-field/');
    expect(Object.fromEntries(link.searchParams)).toEqual({
      q: 'lip stick',
      category: 'beauty',
      min: '2',
      max: '40',
      brand: 'A&B',
      sort: 'price-asc',
      campaign: 'autumn',
      product: '12',
    });
    expect(link.hash).toBe('');
  });

  it('replaces existing product values and supports local preview URLs', () => {
    const link = new URL(
      buildProductLink(
        'http://127.0.0.1:5173/?product=1&product=2&view=list',
        24,
      ),
    );
    expect(link.searchParams.getAll('product')).toEqual(['24']);
    expect(link.searchParams.get('view')).toBe('list');
    expect(link.host).toBe('127.0.0.1:5173');
  });

  it('never carries URL credentials into a copied link', () => {
    const link = new URL(
      buildProductLink('https://user:password@example.com/catalogue/', 3),
    );
    expect(link.username).toBe('');
    expect(link.password).toBe('');
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid product ID %s',
    (id) => {
      expect(() => buildProductLink('https://example.com/', id)).toThrow(
        /product ID/,
      );
    },
  );

  it.each(['javascript:alert(1)', 'file:///catalogue.html', '/relative-path'])(
    'rejects a non-web or incomplete URL %s',
    (url) => {
      expect(() => buildProductLink(url, 1)).toThrow();
    },
  );
});
