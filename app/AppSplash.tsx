'use client';

import { useEffect, useState } from 'react';

export default function AppSplash() {
  const [show, setShow] = useState(true);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setHide(true);
    }, 2500);

    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#000',
        backgroundImage: 'url("/splash-iphone.png")',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        opacity: hide ? 0 : 1,
        pointerEvents: 'none',
        transition: 'opacity 500ms ease'
      }}
    />
  );
}
