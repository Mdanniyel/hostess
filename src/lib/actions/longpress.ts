/**
 * Svelte Action: longpress
 * Triggers a custom 'longpress' event when mouse/touch is held down for specified duration.
 *
 * Usage:
 *   <div use:longpress={800} onlongpress={handleLongpress}>...</div>
 */
export function longpress(node: HTMLElement, duration = 800) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const handleStart = (e: MouseEvent | TouchEvent) => {
    // If it's a right click, ignore it
    if (e instanceof MouseEvent && e.button !== 0) return;

    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent('longpress'));
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
