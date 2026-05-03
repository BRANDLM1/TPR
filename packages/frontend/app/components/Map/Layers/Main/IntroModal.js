'use client';
import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useEffect } from 'react';

export default function IntroModal() {
  useEffect(() => {
      modals.openConfirmModal({
        title: 'Welcome to The Vision2035 Explorer',
        closeOnConfirm: false,
        labels: { confirm: 'Learn More', cancel: 'Close' },
        children: (
          <div className="space-y-4 text-sm font-light">
              <p>
                For years, The Tipi Raisers has worked alongside Native communities to honor wisdom, 
                build community, and create opportunities for reconciliation.
              </p>
              <p>
                The Vision 2035 Explorer is your guide to this work.
              </p>
              <p className = "space-y-8">
                You will travel across ancestral lands to see the challenges, witness the progress, 
                and hear the voices behind each initiative.
              </p>
          </div>

        ),
        styles:{
          content: { 
            marginTop: '150px',
            maxHeight: 'calc(100vh - 120px)',
          },
          header:{
            fontSize: '2rem',
            fontWeight: 'bold',
          },
          body: {
            fontSize: '0.9rem',
          }
        },
        onConfirm: () =>
          modals.openConfirmModal({
            title: 'This is modal at second layer',
            labels: { confirm: 'Close modal', cancel: 'Back' },
            closeOnConfirm: false,
            children: (
              <Text size="md">
                When this modal is closed modals state will revert to first modal
              </Text>
            ),
          styles:{
            content: { 
              marginTop: '250px',
              maxHeight: 'calc(100vh - 120px)',
            },
            header: {
              fontSize: '1.5rem',
              fontWeight: 'bold',
            },
            body: {
              fontSize: '0.9rem',
            }
          },
        onConfirm: modals.closeAll,
         }),
      })
  }, []);
  return null;
}