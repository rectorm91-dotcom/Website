import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rtcarter1.com'),
  title: 'RTCarter1',
  description: 'About RTCarter1',
  openGraph: {
    title: 'RTCarter1',
    description: 'About RTCarter1',
    url: 'https://rtcarter1.com',
    siteName: 'RT',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RT - Aviation & Developer' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RTCarter1',
    description: 'About RTCarter1',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
