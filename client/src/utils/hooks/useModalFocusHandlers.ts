import { useCallback, useRef, useState } from 'react';

/**
 * A reusable hook for managing open/close state and focus restoration
 * for modals/dialogs.
 *
 * @param transitionDuration - Dialog transition duration (ms) to wait before restoring focus
 */
export const useModalFocusHandlers = (transitionDuration: number = 300) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  
  const handleOpen = useCallback(() => {
    // Remove focus ring from the trigger button
    triggerRef.current?.blur();
    requestAnimationFrame(() => setOpen(true));
  }, []);
  
  const handleClose = useCallback(() => {
    setOpen(false);
    // Restore focus after dialog transition ends
    setTimeout(() => {
      if (!open) {
        triggerRef.current?.focus();
      }
    }, transitionDuration);
  }, [open, transitionDuration]);
  
  return {
    open,
    setOpen,
    triggerRef,
    handleOpen,
    handleClose,
  };
};
