import { useEffect, useRef, useCallback } from 'react';

/**
 * useScanner — collects keyboard barcode scanner input
 * (HID scanners emit keystrokes, ending with Enter)
 *
 * @param {function} onScan - called with the scanned barcode string
 * @param {object} options
 * @param {number} options.minLength - minimum barcode length (default 4)
 * @param {number} options.timeout - max ms between keystrokes (default 80)
 */
export function useScanner(onScan, { minLength = 4, timeout = 80 } = {}) {
  const buffer = useRef('');
  const timer  = useRef(null);

  const flush = useCallback(() => {
    const code = buffer.current.trim();
    buffer.current = '';
    if (code.length >= minLength) {
      onScan(code);
    }
  }, [minLength, onScan]);

  useEffect(() => {
    function handleKey(e) {
      // Ignore if focus is on an input/textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        clearTimeout(timer.current);
        flush();
        return;
      }

      // Only accept printable characters
      if (e.key.length !== 1) return;

      buffer.current += e.key;

      clearTimeout(timer.current);
      timer.current = setTimeout(flush, timeout);
    }

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer.current);
    };
  }, [flush, timeout]);
}
