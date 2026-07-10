'use client';
import { useEffect, useState } from 'react';

const QUERY = '(max-width: 639px)';

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return mobile;
}

/** CSS offsets for the canvas area around the fixed bars */
export function canvasOffsets(isMobile: boolean) {
  return isMobile
    ? {
        top: 'calc(56px + env(safe-area-inset-top, 0px))',
        bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        left: 0,
      }
    : { top: 56, bottom: 56, left: 72 };
}
