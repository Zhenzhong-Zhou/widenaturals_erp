import { type RefObject, useCallback, useEffect, useRef } from 'react';
import type { CustomFormRef } from '@components/common/CustomForm';

interface UseModalSuccessLifecycleOptions {
  /** Modal open flag. Used to reset internal state on close. */
  open: boolean;
  /** Truthy when the underlying async operation succeeded. */
  success: boolean;
  /** Optional server-provided message; falls back when undefined. */
  message?: string;
  /** Fallback toast copy used when the server omits a message. */
  fallbackMessage: string;
  /** Parent close handler. */
  onClose: () => void;
  /** Parent success handler — invoked once per successful operation. */
  onSuccess?: (message: string) => void;
  /** Slice action to clear stale success/response state on close. */
  resetState: () => void;
  /** Optional form ref; cleared on every close. */
  formRef?: RefObject<CustomFormRef | null>;
}

interface UseModalSuccessLifecycleResult {
  /** Stable close handler that resets the form (if any) and calls onClose. */
  handleClose: () => void;
}

/**
 * Encapsulates the standard async-modal success lifecycle:
 *   1. Fire `onSuccess` exactly once per successful operation, with the
 *      server message (or a fallback).
 *   2. Reset the form ref and invoke `onClose`.
 *   3. Clear the slice's success/response state and the fire-once guard
 *      whenever the modal closes, so the next open starts clean.
 *
 * Callbacks (`onSuccess`, `onClose`, `resetState`) are read through refs,
 * so callers do not need to memoize them.
 */
const useModalSuccessLifecycle = ({
  open,
  success,
  message,
  fallbackMessage,
  onClose,
  onSuccess,
  resetState,
  formRef,
}: UseModalSuccessLifecycleOptions): UseModalSuccessLifecycleResult => {
  const handledRef = useRef(false);
  const onSuccessRef = useRef(onSuccess);
  const onCloseRef = useRef(onClose);
  const resetStateRef = useRef(resetState);

  // Keep callback refs current without retriggering effects.
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onCloseRef.current = onClose;
    resetStateRef.current = resetState;
  });

  const handleClose = useCallback(() => {
    formRef?.current?.resetForm();
    onCloseRef.current?.();
  }, [formRef]);

  // Fire once when the operation succeeds.
  useEffect(() => {
    if (!success) return;
    if (handledRef.current) return;
    handledRef.current = true;

    onSuccessRef.current?.(message ?? fallbackMessage);
    handleClose();
  }, [success, message, fallbackMessage, handleClose]);

  // Reset slice state and the fire-once guard whenever the modal closes.
  useEffect(() => {
    if (!open) {
      handledRef.current = false;
      resetStateRef.current?.();
    }
  }, [open]);

  return { handleClose };
};

export default useModalSuccessLifecycle;
