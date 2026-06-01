import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STŘELNICE KARLÍN ADMIN',
  description: 'Administrace rezervací',
  manifest: '/admin-manifest.json',
  applicationName: 'Střelnice Karlín Admin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ADMIN'
  },
  icons: {
    apple: [
      {
        url: '/admin-final-v2-apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  }
};

export default function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
