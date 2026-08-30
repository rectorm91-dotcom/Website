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
  title: 'RT | Aviation & Developer',
  description: 'RT is an aviation enthusiast and Lua, Luau, and JavaScript developer based in Dallas, Texas.',
  openGraph: {
    title: 'RT | Aviation & Developer',
    description: 'Aviation enthusiast and developer based in Dallas, Texas.',
    url: 'https://rtcarter1.com',
    siteName: 'RT',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RT — Aviation | Developer' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RT | Aviation & Developer',
    description: 'Aviation enthusiast and developer based in Dallas, Texas.',
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
