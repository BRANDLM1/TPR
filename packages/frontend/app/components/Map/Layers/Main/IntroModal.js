'use client';
import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useEffect } from 'react';

export default function IntroModal() {
  useEffect(() => {
      modals.openConfirmModal({
        title: 'Please confirm your action',
        closeOnConfirm: false,
        labels: { confirm: 'Next modal', cancel: 'Close modal' },
        children: (
          <Text size="sm">
            This action is so important that you are required to confirm it with a modal. Please
            click one of these buttons to proceed.
          </Text>
        ),
        onConfirm: () =>
          modals.openConfirmModal({
            title: 'This is modal at second layer',
            labels: { confirm: 'Close modal', cancel: 'Back' },
            closeOnConfirm: false,
            children: (
              <Text size="sm">
                When this modal is closed modals state will revert to first modal
              </Text>
            ),
            onConfirm: modals.closeAll,
          }),
      })
    }, []);
  return null;
}