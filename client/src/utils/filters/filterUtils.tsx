import { Controller, type Control } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import BaseInput from '@components/common/BaseInput';
import CustomDatePicker from '@components/common/CustomDatePicker';
import BooleanSelect, {
  type BooleanSelectOption,
} from '@components/common/BooleanSelect';

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
 * Renders a reusable controlled CustomDatePicker field for a filter panel.
 */
export const renderDateField = <TFieldValues extends Record<string, any> = any>(
  control: Control<TFieldValues>,
  name: keyof TFieldValues,
  label: string
) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={String(name)}>
    <Controller
      name={name as any}
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
