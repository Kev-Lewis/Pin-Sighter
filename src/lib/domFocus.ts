// DOM focus + scroll-lock helpers for modal dialogs — a focus trap for Tab
// cycling and a reference-counted body scroll lock. Extracted from App.tsx;
// shared by the export/detailed-stat modals in StatsPage and the
// SavedFrameEditModal.

export function trapFocusWithinElement(
  event: KeyboardEvent,
  container: HTMLElement | null
) {
  if (event.key !== "Tab" || !container) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true"
  );

  if (focusableElements.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

let documentScrollLockCount = 0;
let lockedScrollY = 0;
let previousBodyPosition = "";
let previousBodyTop = "";
let previousBodyWidth = "";
let previousBodyOverflow = "";
let previousHtmlOverscrollBehavior = "";

export function lockDocumentScroll() {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (documentScrollLockCount === 0) {
    lockedScrollY = window.scrollY;
    previousBodyPosition = document.body.style.position;
    previousBodyTop = document.body.style.top;
    previousBodyWidth = document.body.style.width;
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverscrollBehavior =
      document.documentElement.style.overscrollBehavior;

    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "contain";
  }

  documentScrollLockCount += 1;

  return () => {
    documentScrollLockCount = Math.max(0, documentScrollLockCount - 1);

    if (documentScrollLockCount > 0) {
      return;
    }

    document.body.style.position = previousBodyPosition;
    document.body.style.top = previousBodyTop;
    document.body.style.width = previousBodyWidth;
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overscrollBehavior =
      previousHtmlOverscrollBehavior;

    window.scrollTo(0, lockedScrollY);
  };
}
