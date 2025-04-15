import type { BaseSyntheticEvent, FC, ReactNode } from 'react';
import { useForm, Controller, type Control, type FieldErrors } from 'react-hook-form';
import {
  Select,
  MenuItem,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Box,
  FormHelperText,
} from '@mui/material';
import BaseInput from '@components/common/BaseInput';
import CustomButton from '@components/common/CustomButton';
import CustomPhoneInput from '@components/common/CustomPhoneInput';
import { useThemeContext } from '@context/ThemeContext';
import type { SxProps, Theme } from '@mui/system';

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'phone';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  defaultValue?: any;
  disabled?: boolean;
  defaultHelperText?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  rows?: number;
  country?: string;
}

interface FormProps {
  children?: ReactNode;
  fields?: FieldConfig[];
  control: Control<any>;
  onSubmit: (
    formData: Record<string, any>,
    e?: BaseSyntheticEvent
  ) => void | Promise<void>;
  submitButtonLabel?: string;
  disabled?: boolean;
  showSubmitButton?: boolean;
  sx?: SxProps<Theme>;
}

const CustomForm: FC<FormProps> = ({
                                     fields = [],
                                     children,
                                     onSubmit,
                                     submitButtonLabel = 'Submit',
                                     control,
                                     showSubmitButton = true,
                                     sx,
                                   }) => {
  const { theme } = useThemeContext();
  
  const {
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onChange' });
  
  const getError = (errors: FieldErrors<any>, id: string, fallback = ''): string => {
    const err = errors[id];
    const message = err && typeof err.message === 'string' ? err.message : undefined;
    return message ?? fallback;
  };
  
  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 600,
        width: '100%',
        margin: '0 auto',
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape?.borderRadius || 8,
        boxShadow: theme.shadows[3],
        ...sx,
      }}
    >
      {fields.map((field) => (
        <Box key={field.id}>
          {/** Text & Number Fields */}
          {(field.type === 'text' || field.type === 'number') && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue ?? ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
                min: field.min ? { value: field.min, message: `Min: ${field.min}` } : undefined,
                max: field.max ? { value: field.max, message: `Max: ${field.max}` } : undefined,
              }}
              render={({ field: controllerField }) => (
                <BaseInput
                  fullWidth
                  id={field.id}
                  label={field.label}
                  type={field.type}
                  value={controllerField.value}
                  onChange={controllerField.onChange}
                  disabled={field.disabled}
                  error={!!errors[field.id]}
                  helperText={getError(errors, field.id, field.defaultHelperText)}
                  placeholder={field.placeholder}
                  slotProps={{
                    htmlInput: field.type === 'number'
                      ? { min: field.min, max: field.max }
                      : {},
                  }}
                />
              )}
            />
          )}

          {/** Phone Number Field */}
          {field.type === 'phone' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue ?? ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: controllerField }) => (
                <CustomPhoneInput
                  value={controllerField.value}
                  onChange={controllerField.onChange}
                  country={field.country || 'ca'}
                />
              )}
            />
          )}

          {/** Textarea Support */}
          {field.type === 'textarea' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue ?? ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: controllerField }) => (
                <BaseInput
                  fullWidth
                  multiline
                  rows={field.rows ?? 4}
                  label={field.label}
                  value={controllerField.value}
                  onChange={controllerField.onChange}
                  disabled={field.disabled}
                  error={!!errors[field.id]}
                  helperText={getError(errors, field.id, field.defaultHelperText)}
                  placeholder={field.placeholder}
                />
              )}
            />
          )}

          {/** Select Dropdown */}
          {field.type === 'select' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue ?? ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: controllerField }) => (
                <FormControl
                  fullWidth
                  error={!!errors[field.id]}
                  sx={{ mb: theme.spacing(2) }}
                >
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    id={field.id}
                    value={controllerField.value}
                    onChange={controllerField.onChange}
                    disabled={field.disabled}
                    label={field.label}
                  >
                    {field.options?.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{getError(errors, field.id, field.defaultHelperText)}</FormHelperText>
                </FormControl>
              )}
            />
          )}

          {/** Checkbox */}
          {field.type === 'checkbox' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue ?? false}
              render={({ field: controllerField }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={controllerField.value}
                      onChange={(e) => controllerField.onChange(e.target.checked)}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  }
                  label={field.label}
                />
              )}
            />
          )}
        </Box>
      ))}
      
      {children}

      {/** Render the Submit button only if `showSubmitButton` is true */}
      {showSubmitButton && (
        <CustomButton type="submit" variant="contained" color="primary">
          {submitButtonLabel}
        </CustomButton>
      )}
    </Box>
  );
};

export default CustomForm;
