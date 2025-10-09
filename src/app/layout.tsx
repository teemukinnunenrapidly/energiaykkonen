import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import DisableConsole from '@/components/DisableConsole';
import GoogleTagManager, {
  GoogleTagManagerNoScript,
} from '@/components/GoogleTagManager';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { GTM_ID } from '@/config/gtm';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'E1 Calculator - Energiaykkönen',
  description:
    'Calculate your energy savings and payback period for heat pump installation',
  keywords:
    'heat pump, energy calculator, energy savings, payback period, CO2 reduction',
  authors: [{ name: 'Energiaykkönen' }],
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon-32x32.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        {/* Google Tag Manager */}
        <GoogleTagManager gtmId={GTM_ID} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <GoogleTagManagerNoScript gtmId={GTM_ID} />
        <DisableConsole />
        {children}
        {/* Cookie Consent Banner */}
        <CookieConsentBanner />
        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
