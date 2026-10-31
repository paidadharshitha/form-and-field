import { RotateCcw, X } from 'lucide-react';

interface UndoNoticeProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoNotice({ message, onUndo, onDismiss }: UndoNoticeProps) {
  return (
    <div className="undo-notice">
      <p role="status" aria-atomic="true">
        {message}
      </p>
      <button type="button" className="undo-button" onClick={onUndo}>
        <RotateCcw size={15} aria-hidden="true" /> Undo
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
