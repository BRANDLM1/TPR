'use client';

import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

import {Lato, IM_Fell_English_SC} from "next/font/google";
import "./globals.css";
import '@mantine/core/styles.css';

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["100", "400", "700"],
});

const fell = IM_Fell_English_SC({
  variable: "--font-fell",
  subsets: ["latin"],
  weight: "400"
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fell.variable} ${lato.variable} antialiased`}>
        <MantineProvider 
            theme={{
              fontFamily: 'var(--font-lato)',
              headings: { fontFamily: 'var(--font-fell)' },
            }}
        >
          <ModalsProvider>
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}