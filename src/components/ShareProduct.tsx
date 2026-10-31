import { useEffect, useId, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CopyState = 'idle' | 'copying' | 'copied' | 'fallback';

export function ShareProduct({ url }: { url: string }) {
  const id = useId();
  const [state, setState] = useState<CopyState>('idle');
  const fallbackInput = useRef<HTMLInputElement>(null);
  const request = useRef(0);

  useEffect(() => {
    request.current += 1;
    setState('idle');
    return () => {
      request.current += 1;
    };
  }, [url]);

  useEffect(() => {
    if (state === 'fallback') {
      fallbackInput.current?.focus({ preventScroll: true });
      fallbackInput.current?.select();
    }
  }, [state]);

  async function copyLink() {
    const attempt = ++request.current;
    setState('copying');
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      if (attempt === request.current) setState('copied');
    } catch {
      if (attempt === request.current) setState('fallback');
    }
  }

  return (
    <div className="share-product">
      <button
        type="button"
        className="share-product-button"
        aria-label="Copy product link"
        disabled={state === 'copying'}
        onClick={() => void copyLink()}
      >
        {state === 'copied' ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
        {state === 'copying'
          ? 'Copying…'
          : state === 'copied'
            ? 'Link copied'
            : 'Copy product link'}
      </button>
      <p
        className="share-status"
        role="status"
        aria-live="polite"
        id={`${id}-status`}
      >
        {state === 'copied'
          ? 'Link copied. Ready to share.'
          : state === 'fallback'
            ? 'Couldn’t copy automatically. Select the link to copy it.'
            : ''}
      </p>
      {state === 'fallback' && (
        <label className="share-link-field" htmlFor={`${id}-link`}>
          <span>Product link</span>
          <input
            ref={fallbackInput}
            id={`${id}-link`}
            type="text"
            readOnly
            value={url}
            aria-describedby={`${id}-status`}
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
            spellCheck={false}
          />
        </label>
      )}
    </div>
  );
}
