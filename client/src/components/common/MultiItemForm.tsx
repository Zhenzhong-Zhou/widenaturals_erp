import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Add from '@mui/icons-material/Add';
import ReplayIcon from '@mui/icons-material/Replay';
import Delete from '@mui/icons-material/Delete';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { v4 as uuidv4 } from 'uuid';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import Dropdown from '@components/common/Dropdown';
import BaseInput from '@components/common/BaseInput';
import CustomButton from '@components/common/CustomButton';
import CustomDatePicker from '@components/common/CustomDatePicker';
import { CustomPhoneInput } from '@components/index.ts';

export interface RowAwareComponentProps {
  value: any;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  helperText?: string;
  rowIndex: number;
}

export interface MultiItemFieldConfig {
  id: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'date'
    | 'dropdown'
    | 'custom'
    | 'checkbox'
    | 'phone'
    | 'email'
    | 'textarea';
  country?: string;
  options?: { value: string; label: string }[];
  component?: (props: RowAwareComponentProps) => ReactNode;
  conditional?: (data: Record<string, any>) => boolean;
  validation?: (value: any) => string | undefined;
  required?: boolean;
  disabled?: boolean;
  defaultHelperText?: string;
  placeholder?: string;
  group?: string;
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

interface MultiItemFormProps {
  getItemTitle?: (index: number, item: Record<string, any>) => string;
  fields: MultiItemFieldConfig[];
  onSubmit: (formData: Record<string, any>[]) => void;
  defaultValues?: Record<string, any>[];
  validation?: (
    watch: (name: string) => any
  ) => Record<string, (value: any) => string | undefined>;
  loading?: boolean;
  renderBeforeFields?: (item: Record<string, any>, index: number) => ReactNode;
}

const MultiItemForm: FC<MultiItemFormProps> = ({
  getItemTitle,
  fields,
  onSubmit,
  defaultValues = [{}],
  validation,
  loading,
  renderBeforeFields,
}) => {
  const { control, handleSubmit, watch, reset } = useForm<{
    items: Record<string, any>[];
  }>({
    defaultValues: { items: defaultValues },
  });

  const allFields = watch('items');

  const {
    fields: fieldArray,
    append,
    remove,
    insert,
  } = useFieldArray({ control, name: 'items', keyName: 'id' });

  const groupFieldsByRow = (fields: MultiItemFieldConfig[]) => {
    const groups: Record<string, MultiItemFieldConfig[]> = {};
    fields.forEach((field) => {
      const groupKey = field.group ?? `__single__${field.id}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(field);
    });
    return Object.values(groups);
  };

  const canSubmit = allFields.every((row) =>
    fields.every((field) => {
      if (!field.required) return true;
      const value = row?.[field.id];
      return value !== undefined && value !== null && value !== '';
    })
  );

  const resetItem = (index: number) => {
    const newRow: Record<string, any> = { id: uuidv4() };

    fields.forEach((field) => {
      newRow[field.id] = field.type === 'checkbox' ? false : '';
    });

    remove(index);
    insert(index, newRow);
  };

  const handleRemove = (id: string) => {
    const index = fieldArray.findIndex((item) => item.id === id);
    if (index !== -1) {
      remove(index); // Remove the correct item using its index
    }
  };

  const handleFormSubmit = (data: { items: Record<string, any>[] }) => {
    const cleanedItems = data.items.filter((item) =>
      Object.values(item).some((v) => v !== null && v !== undefined && v !== '')
    );
    onSubmit(cleanedItems);
  };

  const validationRules = validation ? validation(watch) : {};

  const resetFrom = () => {
    reset({ items: [{ id: uuidv4() }] }); // Reset form state with one empty row
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(handleFormSubmit)}
      sx={{
        maxWidth: '95vw',
        margin: 'auto',
      }}
    >
      {/* Parent Grid for multiple items (renders items in a row) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {fieldArray.map((field, index) => {
          return (
            <Grid
              key={field.id}
              sx={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Item Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                <strong>
                  {getItemTitle?.(index, allFields[index] ?? {}) ??
                    `Item ${index + 1}`}
                </strong>
                <IconButton
                  onClick={() => resetItem(index)}
                  color="primary"
                  title="Reset this item"
                >
                  <ReplayIcon />
                </IconButton>

                {fieldArray.length > 1 && (
                  <IconButton
                    onClick={() => handleRemove(field.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              {renderBeforeFields?.(allFields[index] ?? {}, index)}

              {/* Form Fields (Stacked in Vertical Layout Inside Each Form) */}
              {groupFieldsByRow(fields).map((group, gIdx) => (
                <Grid container spacing={2} key={`group-${gIdx}`}>
                  {group.map((field) => (
                    <Grid
                      size={
                        field.grid || {
                          xs: 12,
                          sm: group.length === 1 ? 12 : 6,
                        }
                      }
                      key={field.id}
                    >
                      <Controller
                        name={`items.${index}.${field.id}` as const}
                        control={control}
                        defaultValue={defaultValues[index]?.[field.id] || ''}
                        render={({ field: { onChange, value } }) => {
                          const {
                            disabled,
                            required,
                            placeholder,
                            defaultHelperText,
                          } = field;

                          const validateFn = validationRules[field.id];
                          const errorMessage = validateFn
                            ? validateFn(value)
                            : undefined;
                          const helperText =
                            errorMessage || defaultHelperText || '';

                          if (field.type === 'custom' && field.component) {
                            const CustomComponent = field.component;
                            return (
                              <CustomComponent
                                value={value}
                                onChange={onChange}
                                disabled={disabled}
                                placeholder={placeholder}
                                error={errorMessage}
                                helperText={helperText}
                                required={required}
                                rowIndex={index}
                              />
                            );
                          }

                          if (field.type === 'select') {
                            return (
                              <Dropdown
                                label={field.label}
                                options={field.options || []}
                                value={value}
                                onChange={onChange}
                                sx={{ width: '250px' }}
                                disabled={disabled}
                                placeholder={placeholder}
                                error={errorMessage}
                                helperText={helperText}
                              />
                            );
                          }

                          if (field.type === 'date') {
                            return (
                              <CustomDatePicker
                                label={field.label}
                                value={value ? new Date(value) : null}
                                onChange={(date) => {
                                  const iso = date ? date.toISOString() : '';
                                  onChange(iso);
                                }}
                                disabled={disabled}
                                helperText={helperText}
                                required={required}
                              />
                            );
                          }

                          if (field.type === 'phone') {
                            const validateFn = validationRules[field.id];
                            const errorMessage = validateFn
                              ? validateFn(value)
                              : undefined;
                            const helperText =
                              errorMessage || field.defaultHelperText || '';

                            return (
                              <FormControl fullWidth error={!!errorMessage}>
                                {field.label && (
                                  <InputLabel shrink required={field.required}>
                                    {field.label}
                                  </InputLabel>
                                )}
                                <CustomPhoneInput
                                  value={value}
                                  onChange={onChange}
                                  country={field.country || 'ca'}
                                  required={field.required}
                                />
                                <FormHelperText>{helperText}</FormHelperText>
                              </FormControl>
                            );
                          }

                          if (field.type === 'email') {
                            return (
                              <BaseInput
                                label={field.label}
                                type="email"
                                value={value || ''}
                                onChange={onChange}
                                fullWidth
                                error={!!errorMessage}
                                helperText={helperText}
                                disabled={disabled}
                                required={required}
                                placeholder={placeholder}
                              />
                            );
                          }

                          if (field.type === 'textarea') {
                            return (
                              <BaseInput
                                label={field.label}
                                value={value || ''}
                                onChange={onChange}
                                fullWidth
                                multiline
                                minRows={3}
                                maxRows={6}
                                error={!!errorMessage}
                                helperText={helperText}
                                disabled={disabled}
                                required={required}
                                placeholder={placeholder}
                              />
                            );
                          }

                          if (field.type === 'text') {
                            return (
                              <BaseInput
                                label={field.label}
                                type={field.type}
                                value={value || ''}
                                onChange={onChange}
                                fullWidth
                                error={!!errorMessage}
                                helperText={helperText}
                                disabled={disabled}
                                required={required}
                                placeholder={placeholder}
                              />
                            );
                          }

                          return (
                            <BaseInput
                              label={field.label}
                              type={field.type}
                              value={value || ''}
                              onChange={onChange}
                              fullWidth
                              sx={{ width: '100%' }}
                              error={!!errorMessage}
                              helperText={helperText}
                              disabled={disabled}
                              required={required}
                              placeholder={placeholder}
                            />
                          );
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              ))}

              {/* Buttons shown only after the last item */}
              {index === fieldArray.length - 1 && canSubmit && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-start',
                    marginTop: 2,
                  }}
                >
                  <CustomButton
                    type="button"
                    variant="outlined"
                    onClick={() => append({ id: uuidv4() })}
                    disabled={loading}
                  >
                    <Add /> Add Another
                  </CustomButton>

                  <CustomButton
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    loading={loading}
                  >
                    Submit All
                  </CustomButton>

                  <CustomButton
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={resetFrom}
                    disabled={loading}
                  >
                    Reset Form
                  </CustomButton>
                </Box>
              )}
            </Grid>
          );
        })}
      </Box>
    </Box>
  );
};

export default MultiItemForm;
