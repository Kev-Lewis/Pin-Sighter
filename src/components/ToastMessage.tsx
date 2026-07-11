// A lightweight, self-dismissing status toast. Renders nothing when `message`
// is empty. Styling lives in the global stylesheets (`.toast-message`).
//
// First component extracted out of the App.tsx monolith (see the roadmap in
// README.md / docs). Kept dependency-free so it can move without dragging any
// app types or helpers along.

type ToastMessageProps = {
  message: string;
  onDismiss: () => void;
};

export function ToastMessage({ message, onDismiss }: ToastMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast-message" role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message">
        ×
      </button>
    </div>
  );
}
