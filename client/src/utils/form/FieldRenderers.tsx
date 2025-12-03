import type { ReactNode } from 'react';
import type { DropdownRenderParams } from '@utils/form/fieldRenderTypes';
import BaseInput from '@components/common/BaseInput';

/* =====================================================================
 * GENERIC DROPDOWN FIELD RENDERER
 * ===================================================================== */

/**
 * Shared generic dropdown renderer.
 *
 * Works for any lookup-based dropdown that:
 * - Uses `value`, `onChange`, and `label`
 * - Has an optional helper-text function
 * - Uses a custom dropdown component
 */
export const renderDropdownField = <T,>({
  label,
  value,
  required,
  onChange,
  options,
  helperTextFn,
  component: Component,
  extraProps = {},
}: DropdownRenderParams<T>) => {
  if (!onChange) return null;

  const helperText = helperTextFn
    ? helperTextFn(value, required, options ?? [])
    : undefined;

  return (
    <Component
      label={label}
      value={value}
      onChange={onChange}
      helperText={helperText}
      {...extraProps}
    />
  );
};

/* =====================================================================
 * BASE INPUT FIELD (TEXT INPUT)
 * ===================================================================== */

/**
 * Generic text input renderer.
 *
 * Supports:
 * - Optional input transformer (e.g., uppercase)
 * - Optional helper text generator
 */
export const renderBaseInputField = ({
  label,
  value,
  required,
  onChange,
  helperTextFn,
  transform,
  fullWidth,
}: {
  label: string;
  value: any;
  required: boolean;
  onChange?: (v: string) => void;
  helperTextFn?: (value: string, required: boolean) => ReactNode;
  transform?: (v: string) => string;
  fullWidth?: boolean;
}) => {
  return (
    <BaseInput
      label={label}
      value={value ?? ''}
      fullWidth={fullWidth}
      onChange={(e) => {
        const raw = e.target.value;
        const output = transform ? transform(raw) : raw;
        onChange?.(output);
      }}
      helperText={
        helperTextFn ? helperTextFn(value ?? '', required) : undefined
      }
    />
  );
};
