'use client';

import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { client } from './lib/apollo';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <MantineProvider
        theme={{
          fontFamily: 'var(--font-lato)',
          headings: { fontFamily: 'var(--font-fell)' },
        }}
      >
        <ModalsProvider>{children}</ModalsProvider>
      </MantineProvider>
    </ApolloProvider>
  );
}
