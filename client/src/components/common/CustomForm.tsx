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
} from '@mui/material';
import { useForm, Controller, Control } from 'react-hook-form';
import { CustomButton, BaseInput } from '@components/index';
import { useThemeContext } from '../../context';

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'number'; // Added 'number'
  options?: { value: string | number; label: string }[]; // For select type
  required?: boolean; // Indicates if the field is required
  defaultValue?: any;
  disabled?: boolean; // New property to disable input fields
  helperText?: string;
}

interface FormProps {
  children?: ReactNode;
  fields?: FieldConfig[];
  control?: Control<any>; // Make it optional if not always required
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
        maxWidth: '400px',
        margin: '0 auto',
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
      }}
    >
      {fields.map((field) => (
        <Box key={field.id}>
          {(field.type === 'text' || field.type === 'number') && (
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
                  type={field.type}
                  value={value}
                  onChange={onChange}
                  error={!!errors[field.id]}
                  helperText={errors[field.id]?.message as string}
                  disabled={field.disabled}
                />
              )}
            />
          )}
          {field.type === 'select' && (
            <Controller
              name={field.id}
              control={control}
              defaultValue={field.defaultValue || ''}
              rules={{
                required: field.required ? `${field.label} is required` : false,
              }}
              render={({ field: { onChange, value } }) => (
                <FormControl fullWidth error={!!errors[field.id]} sx={{ marginBottom: theme.spacing(2) }}>
                  <InputLabel>{field.label}</InputLabel>
                  <Select id={field.id} value={value} onChange={onChange}>
                    {field.options?.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors[field.id]?.message as string}</FormHelperText>
                </FormControl>
              )}
            />
          )}
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
      <CustomButton type="submit" variant="contained" color="primary">
        {submitButtonLabel}
      </CustomButton>
    </Box>
  );
};

export default CustomForm;
