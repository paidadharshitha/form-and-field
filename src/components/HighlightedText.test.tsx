import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HighlightedText } from './HighlightedText';

describe('HighlightedText', () => {
  it('marks exact case-insensitive matches without changing product text', () => {
    const html = renderToStaticMarkup(
      <HighlightedText text="Silk Lipstick and SILK" query="silk" />,
    );
    expect(html).toBe(
      '<mark class="search-highlight">Silk</mark> Lipstick and <mark class="search-highlight">SILK</mark>',
    );
  });

  it('highlights only real query tokens in a typo-matched title', () => {
    expect(
      renderToStaticMarkup(
        <HighlightedText text="Silk Lipstick" query="silk lipstik" />,
      ),
    ).toBe('<mark class="search-highlight">Silk</mark> Lipstick');
    expect(
      renderToStaticMarkup(
        <HighlightedText text="Silk Lipstick" query="lipstik" />,
      ),
    ).toBe('Silk Lipstick');
  });

  it('treats regular-expression characters as literal text', () => {
    expect(
      renderToStaticMarkup(
        <HighlightedText text="A [test] item" query="[test]" />,
      ),
    ).toBe('A <mark class="search-highlight">[test]</mark> item');
  });

  it('escapes supplied HTML instead of injecting it', () => {
    const html = renderToStaticMarkup(
      <HighlightedText text={'<img src="x" onerror="bad()">'} query="img" />,
    );
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;<mark class="search-highlight">img</mark>');
    expect(html).toContain('&quot;');
  });

  it('renders plain text for empty or unmatched searches', () => {
    expect(
      renderToStaticMarkup(<HighlightedText text="Silk Lipstick" query="  " />),
    ).toBe('Silk Lipstick');
    expect(
      renderToStaticMarkup(
        <HighlightedText text="Silk Lipstick" query="chair" />,
      ),
    ).toBe('Silk Lipstick');
  });
});
