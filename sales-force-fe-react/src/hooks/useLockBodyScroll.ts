import { useEffect } from 'react';

let lockCount = 0;

export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount += 1;
    document.body.style.overflow = 'hidden';
    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = '';
      }
    };
  }, [active]);
}
