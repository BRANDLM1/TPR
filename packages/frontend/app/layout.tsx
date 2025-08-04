'use client';
import { ApolloProvider } from '@apollo/client';
import { client } from './lib/apollo';
import { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import 'mapbox-gl/dist/mapbox-gl.css';

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
        <ApolloProvider client={client}>
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
        </ApolloProvider>
      </body>
    </html>
  );
}