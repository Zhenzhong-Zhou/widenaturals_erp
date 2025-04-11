import type { BaseSyntheticEvent, FC, ReactNode } from 'react';
import { useForm, Controller, type Control } from 'react-hook-form';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
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
  helperText?: string;
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
  } = useForm({ mode: 'onChange' }); // Enable real-time validation check

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: '600px', // maxWidth for better layout
        width: '100%',
        margin: '0 auto',
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
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
              defaultValue={field.defaultValue || ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
                min: field.min
                  ? { value: field.min, message: `Min: ${field.min}` }
                  : undefined,
                max: field.max
                  ? { value: field.max, message: `Max: ${field.max}` }
                  : undefined,
              }}
              render={({ field: { onChange, value } }) => (
                <BaseInput
                  fullWidth
                  id={field.id}
                  label={field.label}
                  type={field.type}
                  value={value}
                  onChange={onChange}
                  error={!!errors[field.id]}
                  helperText={
                    (errors[field.id]?.message as string) || field.helperText
                  }
                  disabled={field.disabled}
                  placeholder={field.placeholder}
                  slotProps={{
                    htmlInput:
                      field.type === 'number'
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
              defaultValue={field.defaultValue || ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: { onChange, value } }) => (
                <CustomPhoneInput
                  value={value}
                  onChange={onChange}
                  country={field.country || 'ca'} // Support country selection
                />
              )}
            />
          )}

          {/** Textarea Support */}
          {field.type === 'textarea' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue || ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: { onChange, value } }) => (
                <BaseInput
                  fullWidth
                  id={field.id}
                  label={field.label}
                  multiline
                  rows={field.rows || 4} // Default to 4 rows for better spacing
                  value={value}
                  onChange={onChange}
                  error={!!errors[field.id]}
                  helperText={
                    (errors[field.id]?.message as string) || field.helperText
                  }
                  disabled={field.disabled}
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
              defaultValue={field.defaultValue || ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: { onChange, value } }) => (
                <FormControl
                  fullWidth
                  error={!!errors[field.id]}
                  sx={{ marginBottom: theme.spacing(2) }}
                >
                  <InputLabel>{field.label}</InputLabel>
                  <Select
                    id={field.id}
                    value={value}
                    onChange={onChange}
                    disabled={field.disabled}
                  >
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {(errors[field.id]?.message as string) || field.helperText}
                  </FormHelperText>
                </FormControl>
              )}
            />
          )}

          {/** Checkbox */}
          {field.type === 'checkbox' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue || false}
              render={({ field: { onChange, value } }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      sx={{
                        color: theme.palette.primary.main,
                        '&.Mui-checked': { color: theme.palette.primary.main },
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
