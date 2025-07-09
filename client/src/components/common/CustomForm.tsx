import { type ReactNode, type ForwardedRef, useMemo } from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import {
  useForm,
  Controller,
  type FieldErrors,
  useWatch,
} from 'react-hook-form';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import BaseInput from '@components/common/BaseInput';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import CustomPhoneInput from '@components/common/CustomPhoneInput';
import { useThemeContext } from '@context/ThemeContext';
import type { SxProps, Theme } from '@mui/system';

export interface FieldConfig {
  id: string;
  label?: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'number'
    | 'phone'
    | 'email'
    | 'custom';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  validation?: (value: any) => string | undefined;
  defaultValue?: any;
  disabled?: boolean;
  defaultHelperText?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  rows?: number;
  country?: string;
  customRender?: (params: {
    value?: any;
    onChange?: (val: any) => void;
    required?: boolean;
  }) => ReactNode;
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export interface CustomFormRef {
  resetForm: (values?: Record<string, any>) => void;
}

interface FormProps {
  children?: ReactNode;
  fields?: FieldConfig[];
  initialValues?: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => void | Promise<void>;
  submitButtonLabel?: string;
  disabled?: boolean;
  showSubmitButton?: boolean;
  sx?: SxProps<Theme>;
}

const CustomForm = forwardRef<CustomFormRef, FormProps>(
  (
    {
      fields = [],
      children,
      onSubmit,
      submitButtonLabel = 'Submit',
      initialValues = {},
      showSubmitButton = true,
      sx,
    },
    ref: ForwardedRef<CustomFormRef>
  ) => {
    const { theme } = useThemeContext();

    const {
      control,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm({ mode: 'onChange', defaultValues: initialValues });

    const watchedValues = useWatch({ control });

    const canSubmit = useMemo(() => {
      return (
        fields.length > 0 &&
        fields.every((field) => {
          if (!field.required) return true;
          const value = watchedValues?.[field.id];
          if (typeof value === 'boolean') return true;
          return value !== undefined && value !== null && value !== '';
        })
      );
    }, [fields, watchedValues]);

    useImperativeHandle(ref, () => ({
      resetForm: (values?: Record<string, any>) =>
        reset(values || initialValues),
    }));

    const getError = (
      errors: FieldErrors<any>,
      id: string,
      fallback = ''
    ): string => {
      const err = errors[id];
      return typeof err?.message === 'string' ? err.message : fallback;
    };

    return (
      <Grid container spacing={2}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
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
        <Grid size={{ xs:12 }} sx={{ minHeight: 24 }}>
          {Object.keys(errors).length > 0 && (
            <CustomTypography color="error" variant="body2">
              Please correct the highlighted fields below.
            </CustomTypography>
          )}
        </Grid>
        
        {fields.map((field) => (
          <Grid size={field.grid || { xs: 12, sm: 6 }} key={field.id}>
            {field.type === 'custom' && field.customRender ? (
              <Controller
                name={field.id}
                control={control}
                defaultValue={field.defaultValue ?? ''}
                rules={{
                  required: field.required
                    ? `${field.label} is required`
                    : false,
                }}
                render={({ field: controllerField }) => {
                  const rendered = field.customRender?.({
                    value: controllerField.value,
                    onChange: controllerField.onChange,
                    required: field.required,
                  });

                  if (!rendered || typeof rendered === 'boolean') {
                    // fallback for safety
                    return <></>;
                  }

                  return <>{rendered}</>;
                }}
              />
            ) : (
              <>
                {/** Text & Number Fields */}
                {(field.type === 'text' || field.type === 'number') && (
                  <Controller
                    name={field.id}
                    control={control}
                    defaultValue={field.defaultValue ?? ''}
                    rules={{
                      required: field.required
                        ? `${field.label} is required`
                        : false,
                      min: field.min
                        ? { value: field.min, message: `Min: ${field.min}` }
                        : undefined,
                      max: field.max
                        ? { value: field.max, message: `Max: ${field.max}` }
                        : undefined,
                    }}
                    render={({ field: controllerField }) => (
                      <BaseInput
                        fullWidth
                        id={field.id}
                        label={field.label}
                        type={field.type}
                        value={controllerField.value}
                        required={field.required}
                        onChange={controllerField.onChange}
                        disabled={field.disabled}
                        error={!!errors[field.id]}
                        helperText={getError(
                          errors,
                          field.id,
                          field.defaultHelperText
                        )}
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
                  <FormControl
                    fullWidth
                    error={!!errors[field.id]}
                    sx={{ mb: theme.spacing(2) }}
                  >
                    {field.label && (
                      <InputLabel shrink required={field.required}>
                        {field.label}
                      </InputLabel>
                    )}
                    
                    <Controller
                      name={field.id}
                      control={control}
                      defaultValue={field.defaultValue ?? ''}
                      rules={{
                        required: field.required ? `${field.label} is required` : false,
                      }}
                      render={({ field: controllerField }) => (
                        <CustomPhoneInput
                          required={field.required}
                          value={controllerField.value}
                          onChange={controllerField.onChange}
                          country={field.country || 'ca'}
                        />
                      )}
                    />
                    
                    <FormHelperText>
                      {getError(errors, field.id, field.defaultHelperText)}
                    </FormHelperText>
                  </FormControl>
                )}
                
                {/** Email Field */}
                {field.type === 'email' && (
                  <Controller
                    name={field.id}
                    control={control}
                    defaultValue={field.defaultValue ?? ''}
                    rules={{
                      required: field.required
                        ? `${field.label} is required`
                        : false,
                      validate: field.validation,
                    }}
                    render={({ field: controllerField }) => (
                      <BaseInput
                        fullWidth
                        label={field.label}
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        disabled={field.disabled}
                        required={field.required}
                        error={!!errors[field.id]}
                        helperText={getError(
                          errors,
                          field.id,
                          field.defaultHelperText
                        )}
                        placeholder={field.placeholder}
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
                      required: field.required
                        ? `${field.label} is required`
                        : false,
                    }}
                    render={({ field: controllerField }) => (
                      <BaseInput
                        fullWidth
                        multiline
                        rows={field.rows ?? 4}
                        label={field.label}
                        value={controllerField.value}
                        onChange={controllerField.onChange}
                        required={field.required}
                        disabled={field.disabled}
                        error={!!errors[field.id]}
                        helperText={getError(
                          errors,
                          field.id,
                          field.defaultHelperText
                        )}
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
                      required: field.required
                        ? `${field.label} is required`
                        : false,
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
                        <FormHelperText>
                          {getError(errors, field.id, field.defaultHelperText)}
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
                    defaultValue={field.defaultValue ?? false}
                    render={({ field: controllerField }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={controllerField.value}
                            onChange={(e) =>
                              controllerField.onChange(e.target.checked)
                            }
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
              </>
            )}
          </Grid>
        ))}

        {children}

        {/** Render the Submit button only if `showSubmitButton` is true */}
        <Box sx={{ minHeight: 40 }}>
          {showSubmitButton && (
            <CustomTypography sx={{ color: 'warning.main' }} variant="body2">
              Please complete all required fields to proceed.
            </CustomTypography>
          )}

          {showSubmitButton && canSubmit && (
            <CustomButton type="submit" variant="contained" color="primary">
              {submitButtonLabel}
            </CustomButton>
          )}
        </Box>
      </Grid>
    );
  }
);

CustomForm.displayName = 'CustomForm';
export default CustomForm;
