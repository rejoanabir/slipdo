import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Payment Receipt - Fast Branded Receipts for Small Business',
  description: 'Create branded PDF & thermal receipts, send via WhatsApp, email or SMS in under 30 seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
