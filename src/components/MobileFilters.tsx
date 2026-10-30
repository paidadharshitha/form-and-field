import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface MobileFiltersProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  count: number;
  children: ReactNode;
}

export function MobileFilters({
  open,
  onClose,
  onClear,
  count,
  children,
}: MobileFiltersProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previousFocus = document.activeElement;
    element.showModal();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = originalOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="mobile-filter-dialog"
      aria-labelledby="mobile-filter-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mobile-filter-content">
        <div className="mobile-filter-header">
          <h2 id="mobile-filter-title">Find your fit</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close filters"
          >
            <X size={22} />
          </button>
        </div>
        {children}
        <div className="mobile-filter-footer">
          <button className="text-button" onClick={onClear}>
            Reset all
          </button>
          <button className="primary-button" onClick={onClose}>
            Show {count} {count === 1 ? 'product' : 'products'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
