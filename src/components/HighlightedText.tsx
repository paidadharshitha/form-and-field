interface HighlightedTextProps {
  text: string;
  query?: string;
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Render real matching letters as text nodes; typo-corrected letters stay plain. */
export function HighlightedText({ text, query = '' }: HighlightedTextProps) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return <>{text}</>;
  const terms = text.toLowerCase().includes(trimmedQuery.toLowerCase())
    ? [trimmedQuery]
    : [...new Set(trimmedQuery.split(/\s+/).filter(Boolean))]
        .filter((term) => text.toLowerCase().includes(term.toLowerCase()))
        .sort((left, right) => right.length - left.length);
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map(escapePattern).join('|')})`, 'giu');
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 === 1 ? (
          <mark className="search-highlight" key={index}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
