import { FC, ReactNode } from 'react';
import {
  Select,
  MenuItem,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Box,
  FormHelperText,
  TextField,
} from '@mui/material';
import { useForm, Controller, Control } from 'react-hook-form';
import { CustomButton, CustomPhoneInput } from '@components/index';
import { useThemeContext } from '../../context/ThemeContext';

export interface FieldConfig {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "phone";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  defaultValue?: any;
  disabled?: boolean;
  helperText?: string;
  placeholder?: string; // Added placeholder support
  min?: number; // Min for number fields
  max?: number; // Max for number fields
  rows?: number; // Support for textarea
  country?: string; // Support for phone input
}

interface FormProps {
  children?: ReactNode;
  fields?: FieldConfig[];
  control: Control<any>; // Ensure control is required
  onSubmit: (formData: Record<string, any>) => void | Promise<void>;
  submitButtonLabel?: string;
  disabled?: boolean;
}

const CustomForm: FC<FormProps> = ({
  fields = [],
  children,
  onSubmit,
  submitButtonLabel = 'Submit',
  control,
}) => {
  const { theme } = useThemeContext();
  const {
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: '600px', // Increased maxWidth for better layout
        width: '100%',
        margin: '0 auto',
        padding: theme.spacing(3),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
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
                <TextField
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
          {field.type === "phone" && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue || ""}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: { onChange, value } }) => (
                <CustomPhoneInput
                  value={value}
                  onChange={onChange}
                  country={field.country || "us"} // Support country selection
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
                <TextField
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

      {/** Submit Button */}
      <CustomButton type="submit" variant="contained" color="primary">
        {submitButtonLabel}
      </CustomButton>
    </Box>
  );
};

export default CustomForm;
