'use client';

import { useEffect } from 'react';

export default function AppSplash() {
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      const splash = document.getElementById('app-splash');
      if (splash) {
        splash.style.opacity = '0';
      }
    }, 2500);

    const removeTimer = setTimeout(() => {
      const splash = document.getElementById('app-splash');
      if (splash) {
        splash.remove();
      }
    }, 3100);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div
      id="app-splash"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity 600ms ease'
      }}
    >
      <img
        src="/splash-iphone.png"
        alt="Střelnice Karlín"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block'
        }}
      />
    </div>
  );
}
