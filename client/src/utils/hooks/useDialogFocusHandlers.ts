import { useCallback, type RefObject, type MouseEvent } from 'react';

/**
 * useDialogFocusHandlers
 *
 * Accessibility-focused helper hook for managing focus behavior
 * when opening and closing dialogs.
 *
 * Responsibilities:
 * - Remove focus from the triggering element before dialog mount
 * - Open the dialog in the next animation frame to avoid focus conflicts
 * - Restore focus to the triggering button after dialog close
 * - Guard against focus restoration while the dialog is still open
 *
 * Intended usage:
 * - Modal dialogs opened via button click
 * - Forms or creation dialogs requiring clean focus transitions
 *
 * Accessibility notes:
 * - Prevents focus from being trapped on the trigger button
 * - Ensures focus is returned to a predictable location on close
 * - Respects dialog transition timing before restoring focus
 *
 * @param setDialogOpen
 *   State setter controlling dialog visibility.
 *
 * @param createButtonRef
 *   Ref to the element that triggered the dialog open action.
 *   Focus will be restored to this element after dialog close.
 *
 * @param getDialogOpen
 *   Getter function returning the current dialog open state.
 *   Used to prevent premature focus restoration.
 *
 * @returns
 *   An object containing dialog focus handlers:
 *   - `handleOpenDialog` — Opens the dialog with safe focus handling
 *   - `handleCloseDialog` — Closes the dialog and restores focus when appropriate
 */
const useDialogFocusHandlers = (
  setDialogOpen: (open: boolean) => void,
  createButtonRef: RefObject<HTMLButtonElement | null>,
  getDialogOpen: () => boolean
) => {
  const handleOpenDialog = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      // Remove focus from trigger before dialog mount
      e?.currentTarget?.blur?.();
      
      // Defer opening to avoid focus race conditions
      requestAnimationFrame(() => setDialogOpen(true));
    },
    [setDialogOpen]
  );
  
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    
    // Restore focus only after dialog is fully closed
    setTimeout(() => {
      if (!getDialogOpen()) {
        createButtonRef.current?.focus();
      }
    }, 300); // must align with dialog transition duration
  }, [setDialogOpen, createButtonRef, getDialogOpen]);
  
  return { handleOpenDialog, handleCloseDialog };
};

export default useDialogFocusHandlers;
