import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'STŘELNICE KARLÍN – Rezervace',
  description: 'Online rezervace hodin na střelnici',
  applicationName: 'Střelnice Karlín',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Střelnice Karlín'
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
};

export const viewport: Viewport = {
  themeColor: '#070907',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link
  rel="manifest"
  href={
    typeof window !== 'undefined' && window.location.pathname.startsWith('/cp-system')
      ? '/admin-manifest.json'
      : '/user-manifest.json'
  }
/>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                if (location.pathname.startsWith('/cp-system')) {
                  var manifest = document.querySelector('link[rel="manifest"]');
                  if (manifest) {
                    manifest.setAttribute('href', '/admin-manifest.json');
                  }

                  var appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                  if (!appleIcon) {
                    appleIcon = document.createElement('link');
                    appleIcon.setAttribute('rel', 'apple-touch-icon');
                    document.head.appendChild(appleIcon);
                  }

                  appleIcon.setAttribute('href', '/admin-final-v2-apple-touch-icon.png');
                  document.title = 'STŘELNICE KARLÍN ADMIN';
                }
              })();
            `
          }}
        />

        <link
          rel="apple-touch-startup-image"
          href="/splash-iphone.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />

        <link
          rel="apple-touch-startup-image"
          href="/splash-iphone-large.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />

        <link
          rel="apple-touch-startup-image"
          href="/splash-ipad.png"
          media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
