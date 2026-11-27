import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'SlipDo — Smart Digital Receipts for Bangladesh & Beyond',
  description:
    'Create branded digital receipts and traditional Bangla cash memos in <30s. Instant WhatsApp & SMS billing with thermal printing support.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'SlipDo — Smart Digital Receipts & Cash Memos',
    description:
      'Fast branded vouchers & verified digital cash memos for Bangladesh merchants. Instant WhatsApp sharing and 58mm/80mm thermal printing.',
    url: 'https://slipdo.app',
    siteName: 'SlipDo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SlipDo — Smart Digital Receipts',
    description:
      'Fast branded vouchers & verified digital cash memos for Bangladesh merchants.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F8FAFC] pb-20 md:pb-6 font-sans">
        {children}
      </body>
    </html>
  );
}
