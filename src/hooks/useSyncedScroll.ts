import { useCallback, useRef } from 'react';

/**
 * Keep two scroll containers in sync: scrolling one proportionally scrolls the
 * other to the corresponding spot. Proportional (ratio-based) so the lists stay
 * aligned start-to-end even if their rows differ slightly in height.
 *
 * Usage:
 *   const { aRef, bRef, onScrollA, onScrollB } = useSyncedScroll();
 *   <div ref={aRef} onScroll={onScrollA} />
 *   <div ref={bRef} onScroll={onScrollB} />
 */
export function useSyncedScroll<T extends HTMLElement = HTMLDivElement>() {
  const aRef = useRef<T | null>(null);
  const bRef = useRef<T | null>(null);
  // Which side initiated the current scroll, so the programmatic scroll of the
  // other side doesn't echo back and fight the user.
  const lock = useRef<'a' | 'b' | null>(null);

  const sync = useCallback((src: T | null, dst: T | null, tag: 'a' | 'b') => {
    if (!src || !dst) return;
    // Ignore the echo from the side we just drove.
    if (lock.current && lock.current !== tag) {
      lock.current = null;
      return;
    }
    lock.current = tag;
    const srcMax = src.scrollHeight - src.clientHeight;
    const dstMax = dst.scrollHeight - dst.clientHeight;
    const ratio = srcMax > 0 ? src.scrollTop / srcMax : 0;
    dst.scrollTop = ratio * dstMax;
    // Safety release in case the programmatic scroll produced no echo event
    // (e.g. position unchanged), so the lock never gets stuck.
    requestAnimationFrame(() => {
      if (lock.current === tag) lock.current = null;
    });
  }, []);

  const onScrollA = useCallback(() => sync(aRef.current, bRef.current, 'a'), [sync]);
  const onScrollB = useCallback(() => sync(bRef.current, aRef.current, 'b'), [sync]);

  return { aRef, bRef, onScrollA, onScrollB };
}
