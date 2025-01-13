import { FC, useState } from 'react';
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
import { CustomButton, BaseInput } from '@components/index';
import { useThemeContext } from '../../context/ThemeContext.tsx';

export interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  options?: { value: string | number; label: string }[]; // For select type
  required?: boolean; // Indicates if the field is required
  defaultValue?: any;
}

interface FormProps {
  fields: FieldConfig[];
  onSubmit: (formData: Record<string, any>) => void; // Callback for form submission
  submitButtonLabel?: string;
}

const Form: FC<FormProps> = ({ fields, onSubmit, submitButtonLabel = 'Submit' }) => {
  const { theme } = useThemeContext();
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => {
      acc[field.id] = field.defaultValue || (field.type === 'checkbox' ? false : '');
      return acc;
    }, {} as Record<string, any>)
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };
  
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
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
          {field.type === 'text' && (
            <BaseInput
              fullWidth
              id={field.id}
              label={field.label}
              value={formData[field.id]}
              onChange={(e) => handleChange(field.id, e.target.value)}
              error={!!errors[field.id]}
              helperText={errors[field.id]}
            />
          )}
          {field.type === 'select' && (
            <FormControl
              fullWidth
              error={!!errors[field.id]}
              sx={{ marginBottom: theme.spacing(2) }}
            >
              <InputLabel>{field.label}</InputLabel>
              <Select
                id={field.id}
                value={formData[field.id]}
                onChange={(e) => handleChange(field.id, e.target.value)}
              >
                {field.options?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors[field.id]}</FormHelperText>
            </FormControl>
          )}
          {field.type === 'checkbox' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[field.id]}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  sx={{
                    color: theme.palette.primary.main,
                    '&.Mui-checked': { color: theme.palette.primary.main },
                  }}
                />
              }
              label={field.label}
            />
          )}
        </Box>
      ))}
      <CustomButton type="submit" variant="contained" color="primary">
        {submitButtonLabel}
      </CustomButton>
    </Box>
  );
};

export default Form;
