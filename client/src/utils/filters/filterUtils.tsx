import { Controller, type Control, FieldValues, Path } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import BaseInput from '@components/common/BaseInput';
import CustomDatePicker from '@components/common/CustomDatePicker';
import BooleanSelect, {
  type BooleanSelectOption,
} from '@components/common/BooleanSelect';
import Dropdown, { type OptionType } from '@components/common/Dropdown';

/**
 * Renders a reusable controlled BaseInput field for a filter panel.
 *
 * @template TFieldValues - The shape of the form data.
 * @param control - React Hook Form control instance.
 * @param name - Field name.
 * @param label - Field label for the input.
 * @param placeholder - Optional placeholder for the input.
 * @param fullWidth - If true, sets the BaseInput to full width (default: false).
 * @returns JSX.Element - The rendered input field.
 */
export const renderInputField = <
  TFieldValues extends Record<string, any> = any,
>(
  control: Control<TFieldValues>,
  name: keyof TFieldValues,
  label: string,
  placeholder?: string,
  fullWidth: boolean = true
) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={String(name)}>
    <Controller
      name={name as any}
      control={control}
      render={({ field }) => (
        <BaseInput
          {...field}
          value={field.value ?? ''}
          label={label}
          placeholder={placeholder}
          fullWidth={fullWidth}
          sx={{ minHeight: 56 }}
        />
      )}
    />
  </Grid>
);

/**
 * Renders a reusable, react-hook-form–controlled date picker field
 * for filter panels.
 *
 * - Integrates `CustomDatePicker` with react-hook-form via `Controller`
 * - Supports both flat and deeply nested form paths using `Path<T>`
 * - Applies a consistent Grid layout used across list filter panels
 * - Normalizes empty values to avoid uncontrolled input warnings
 *
 * Intended for use in dynamic filter panels where date range fields
 * are rendered declaratively from configuration.
 *
 * @typeParam TFieldValues - react-hook-form field values shape
 * @param control - react-hook-form control object
 * @param name - Field path (supports nested paths)
 * @param label - Display label for the date picker
 * @returns JSX element wrapped in a responsive Grid cell
 */
export const renderDateField = <TFieldValues extends FieldValues = FieldValues>(
  control: Control<TFieldValues>,
  name: Path<TFieldValues>,
  label: string
) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={String(name)}>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CustomDatePicker
          {...field}
          value={field.value ?? ''}
          label={label}
          sx={{ minHeight: 56 }}
        />
      )}
    />
  </Grid>
);

/**
 * Renders a reusable BooleanSelect field
 */
export const renderBooleanSelectField = <T extends Record<string, any>>(
  control: Control<T>,
  name: keyof T,
  label: string,
  options?: BooleanSelectOption[],
  allowAll: boolean = true
) => {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={String(name)}>
      <Controller
        name={name as any}
        control={control}
        render={({ field }) => (
          <BooleanSelect
            {...field}
            label={label}
            options={options}
            allowAll={allowAll}
          />
        )}
      />
    </Grid>
  );
};

/**
 * Generic reusable select field renderer using your custom <Dropdown />.
 */
export const renderSelectField = <T extends Record<string, any>>(
  control: Control<T>,
  name: keyof T,
  label: string,
  options: OptionType[] = [],
  allowAll: boolean = true
) => {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={String(name)}>
      <Controller
        name={name as any}
        control={control}
        render={({ field, fieldState }) => {
          const finalOptions = allowAll
            ? [{ label: 'All', value: null }, ...options]
            : options;

          return (
            <Dropdown
              label={label}
              value={field.value ?? null}
              onChange={(val) => field.onChange(val ?? null)}
              options={finalOptions}
              helperText={fieldState.error?.message}
              error={fieldState.error?.message || null}
              searchable={true}
              placeholder={`Select ${label}`}
            />
          );
        }}
      />
    </Grid>
  );
};

/**
 * Renders a reusable controlled numeric BaseInput field for a filter panel.
 *
 * @template TFieldValues - Shape of React Hook Form data.
 * @param control - React Hook Form control instance.
 * @param name - Field name.
 * @param label - Input label.
 * @param placeholder - Optional placeholder text.
 * @param fullWidth - Whether the field spans full width (default: true).
 * @returns JSX.Element - The rendered numeric input field wrapped in a Grid item.
 */
export const renderNumericField = <
  TFieldValues extends Record<string, any> = any,
>(
  control: Control<TFieldValues>,
  name: keyof TFieldValues,
  label: string,
  placeholder?: string,
  fullWidth: boolean = true
) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={String(name)}>
    <Controller
      name={name as any}
      control={control}
      render={({ field }) => (
        <BaseInput
          {...field}
          type="number"
          inputMode="numeric"
          value={field.value ?? ''}
          label={label}
          placeholder={placeholder}
          fullWidth={fullWidth}
          sx={{ minHeight: 56 }}
          // ensure numbers stay numeric
          onChange={(e) => {
            const value = e.target.value;
            // empty input → null (so filter is cleared)
            if (value === '' || value === null) {
              field.onChange(null);
              return;
            }
            // convert to number
            const num = Number(value);
            field.onChange(Number.isNaN(num) ? null : num);
          }}
        />
      )}
    />
  </Grid>
);
