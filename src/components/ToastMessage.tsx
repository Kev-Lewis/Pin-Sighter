// A lightweight, self-dismissing status toast. Renders nothing when `message`
// is empty. Styling lives in the global stylesheets (`.toast-message`).
//
// First component extracted out of the App.tsx monolith (see the roadmap in
// README.md / docs). Kept dependency-free so it can move without dragging any
// app types or helpers along.

type ToastMessageProps = {
  message: string;
  onDismiss: () => void;
  /** Optional extra class (e.g. a page-scoped floating variant). */
  className?: string;
};

export function ToastMessage({ message, onDismiss, className }: ToastMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`toast-message${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}
