import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Lato, IM_Fell_English_SC } from 'next/font/google';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mantine/core/styles.css';
import './globals.css';
import Providers from './providers';

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['100', '400', '700'],
});

const fell = IM_Fell_English_SC({
  variable: '--font-fell',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'The Tipi Raisers — Vision 2035',
  description:
    'An interactive map-based exploration of The Tipi Raisers\' Vision 2035 campaign.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fell.variable} ${lato.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
