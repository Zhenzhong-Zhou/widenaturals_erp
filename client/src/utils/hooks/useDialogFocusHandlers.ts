import { useCallback, type RefObject, type MouseEvent } from 'react';

export const useDialogFocusHandlers = (
  setDialogOpen: (open: boolean) => void,
  createButtonRef: RefObject<HTMLButtonElement | null>,
  getDialogOpen: () => boolean
) => {
  const handleOpenDialog = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.blur();
      requestAnimationFrame(() => setDialogOpen(true));
    },
    [setDialogOpen]
  );

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => {
      // Only restore focus if the dialog is fully closed
      if (!getDialogOpen()) {
        createButtonRef.current?.focus();
      }
    }, 300); // match your dialog transition and extra buffer
  }, [setDialogOpen, createButtonRef, getDialogOpen]);

  return { handleOpenDialog, handleCloseDialog };
};
