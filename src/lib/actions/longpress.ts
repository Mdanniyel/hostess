/**
 * Svelte Action: longpress
 * Triggers the provided callback function when the element is held down for 800ms.
 * Automatically disables native text selection and mobile long-press context menus.
 *
 * Usage:
 *   <div use:longpress={() => settingsService.open()}>...</div>
 */
export function longpress(node: HTMLElement, callback: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const duration = 800; // ms

  const handleStart = (e: MouseEvent | TouchEvent) => {
    if (e instanceof MouseEvent && e.button !== 0) return;

    timer = setTimeout(() => {
      callback();
    }, duration);
  };

  const handleCancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  node.addEventListener('mousedown', handleStart);
  node.addEventListener('mouseup', handleCancel);
  node.addEventListener('mouseleave', handleCancel);

  node.addEventListener('touchstart', handleStart, { passive: true });
  node.addEventListener('touchend', handleCancel);
  node.addEventListener('touchcancel', handleCancel);

  // Disable native iOS long-press image share menu & text selection
  node.style.setProperty('-webkit-touch-callout', 'none');
  node.style.setProperty('-webkit-user-select', 'none');
  node.style.setProperty('user-select', 'none');

  return {
    destroy() {
      node.removeEventListener('mousedown', handleStart);
      node.removeEventListener('mouseup', handleCancel);
      node.removeEventListener('mouseleave', handleCancel);
      node.removeEventListener('touchstart', handleStart);
      node.removeEventListener('touchend', handleCancel);
      node.removeEventListener('touchcancel', handleCancel);
      if (timer) clearTimeout(timer);
    }
  };
}
