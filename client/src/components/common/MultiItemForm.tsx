import {
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  useForm,
  Controller,
  useFieldArray,
  type Control,
} from 'react-hook-form';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Add from '@mui/icons-material/Add';
import ReplayIcon from '@mui/icons-material/Replay';
import Delete from '@mui/icons-material/Delete';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Dropdown from '@components/common/Dropdown';
import BaseInput from '@components/common/BaseInput';
import CustomButton from '@components/common/CustomButton';
import CustomDatePicker from '@components/common/CustomDatePicker';
import CustomPhoneInput from '@components/common/CustomPhoneInput';

export interface RowAwareComponentProps<T = any> {
  value: T;
  onChange: (value: T) => void;
  control: Control<any>;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  helperText?: string;
  rowIndex: number;
  getRowValues?: () => Record<string, any>;
  setRowValues?: (next: Record<string, any>) => void;
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
  component?: (props: RowAwareComponentProps) => ReactNode | null;
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

export interface MultiItemFormRef {
  getItems: () => Record<string, any>[];
}

interface MultiItemFormProps {
  getItemTitle?: (index: number, item: Record<string, any>) => string;
  fields: MultiItemFieldConfig[];
  onSubmit?: (formData: Record<string, any>[]) => void;
  defaultValues?: Record<string, any>[];
  validation?: (
    watch: (name: string) => any
  ) => Record<string, (value: any) => string | undefined>;
  loading?: boolean;
  renderBeforeFields?: (item: Record<string, any>, index: number) => ReactNode;
  showSubmitButton?: boolean; // default true
  onItemsChange?: (items: Record<string, any>[]) => void;
  makeNewRow?: () => Record<string, any>;
}

const MultiItemForm = forwardRef<MultiItemFormRef, MultiItemFormProps>(
  (props, ref) => {
    const {
      getItemTitle,
      fields,
      onSubmit,
      defaultValues = [{}],
      validation,
      loading,
      renderBeforeFields,
      showSubmitButton = true,
    } = props;

    const makeNewRowInternal = useMemo(
      () =>
        props.makeNewRow ??
        (() => {
          const row: Record<string, any> = { id: uuidv4(), line_type: 'sku' }; // default line type
          fields.forEach((f) => {
            if (row[f.id] === undefined) {
              row[f.id] = f.type === 'checkbox' ? false : '';
            }
          });
          // ensure a boolean default for this specific switch
          row.show_barcode_toggle = false;
          return row;
        }),
      [props.makeNewRow, fields]
    );

    const initialItems = defaultValues?.length
      ? defaultValues
      : [makeNewRowInternal()];

    const { control, handleSubmit, watch, reset, getValues, setValue } =
      useForm<{ items: Record<string, any>[] }>({
        defaultValues: { items: initialItems },
      });

    const allFields = watch('items');

    useImperativeHandle(ref, () => ({
      getItems: () => (getValues('items') ?? []).map((r) => ({ ...r })),
    }));

    useEffect(() => {
      // 1) push initial items on mount (so parent has defaults)
      const initial = getValues('items') ?? [];
      props.onItemsChange?.(initial.map((r) => ({ ...r })));

      // 2) subscribe to ALL changes under "items"
      const subscription = watch((_, { name }) => {
        if (!name || !name.startsWith('items')) return;
        const current = getValues('items') ?? [];
        // emit a fresh, cloned snapshot each change
        props.onItemsChange?.(current.map((r) => ({ ...r })));
      });

      return () => subscription.unsubscribe();
      // watch & getValues are stable from RHF; only depend on onItemsChange
    }, [watch, getValues, props.onItemsChange]);

    const {
      fields: fieldArray,
      append,
      remove,
      insert,
    } = useFieldArray({ control, name: 'items', keyName: 'fieldKey' });

    const groupFieldsByRow = (fields: MultiItemFieldConfig[]) => {
      const groups: Record<string, MultiItemFieldConfig[]> = {};
      fields.forEach((field) => {
        const groupKey = field.group ?? `__single__${field.id}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(field);
      });
      return Object.values(groups);
    };

    const canSubmit = allFields.every((row) => {
      const visibleFields = fields.filter(
        (f) => !f.conditional || f.conditional(row ?? {})
      );
      return visibleFields.every((f) => {
        if (!f.required) return true;
        const v = row?.[f.id];
        return v !== undefined && v !== null && v !== '';
      });
    });

    const resetItem = (index: number) => {
      remove(index);
      insert(index, makeNewRowInternal());
    };

    const handleRemove = (id: string) => {
      const index = fieldArray.findIndex((item) => item.id === id);
      if (index !== -1) {
        remove(index); // Remove the correct item using its index
      }
    };

    const prepareFormDataForSubmit = (formData: {
      items: Record<string, any>[];
    }) => {
      return {
        ...formData,
        items: formData.items.map(
          ({ line_type, show_barcode_toggle, ...rest }) => rest
        ),
      };
    };

    const handleFormSubmit = (data: { items: Record<string, any>[] }) => {
      const cleanedItems = data.items.filter((item) =>
        Object.values(item).some(
          (v) => v !== null && v !== undefined && v !== ''
        )
      );

      const preparedData = prepareFormDataForSubmit({ items: cleanedItems });

      if (onSubmit) {
        onSubmit(preparedData.items);
      }
    };

    const validationRules = validation ? validation(watch) : {};

    const resetForm = () => {
      reset({ items: [makeNewRowInternal()] }); // Reset form state with one empty row
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
                key={field.fieldKey}
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
                    {group.map((field) => {
                      // current row snapshot
                      const rowData = getValues(`items.${index}`) ?? {};

                      // respect conditional visibility if provided
                      if (
                        typeof field.conditional === 'function' &&
                        !field.conditional(rowData)
                      ) {
                        return null;
                      }

                      const grid = field.grid || {
                        xs: 12,
                        sm: group.length === 1 ? 12 : 6,
                      };

                      return (
                        <Grid
                          key={field.id}
                          size={{
                            xs: grid.xs,
                            sm: grid.sm,
                            md: grid.md,
                            lg: grid.lg,
                          }}
                        >
                          <Controller
                            name={`items.${index}.${field.id}` as const}
                            control={control}
                            defaultValue={
                              defaultValues?.[index]?.[field.id] ??
                              getValues(`items.${index}.${field.id}`) ??
                              (field.type === 'checkbox' ? false : '')
                            }
                            render={({ field: { onChange, value } }) => {
                              const {
                                disabled,
                                required,
                                placeholder,
                                defaultHelperText,
                              } = field;
                              const validateFn = validationRules[field.id];
                              const errorMessage = validateFn?.(value);
                              const helperText =
                                errorMessage || defaultHelperText || '';

                              if (field.type === 'custom' && field.component) {
                                const CustomComponent = field.component;

                                // Provide row helpers (optional; backward-compatible)
                                const getRowValues = () =>
                                  getValues(`items.${index}`) ?? {};
                                const setRowValues = (
                                  next: Record<string, any>
                                ) =>
                                  setValue(`items.${index}`, next, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });

                                // Always return a ReactElement
                                return (
                                  <>
                                    {CustomComponent({
                                      value,
                                      onChange,
                                      control,
                                      disabled,
                                      placeholder,
                                      error: errorMessage,
                                      helperText,
                                      required,
                                      rowIndex: index,
                                      getRowValues,
                                      setRowValues,
                                    }) ?? null}
                                  </>
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
                                    onChange={(date) =>
                                      onChange(date ? date.toISOString() : '')
                                    }
                                    disabled={disabled}
                                    helperText={helperText}
                                    required={required}
                                  />
                                );
                              }

                              if (field.type === 'phone') {
                                const errorMessage = validateFn?.(value);
                                const helperText =
                                  errorMessage || field.defaultHelperText || '';

                                return (
                                  <FormControl fullWidth error={!!errorMessage}>
                                    {field.label && (
                                      <InputLabel
                                        shrink
                                        required={field.required}
                                      >
                                        {field.label}
                                      </InputLabel>
                                    )}
                                    <CustomPhoneInput
                                      value={value}
                                      onChange={onChange}
                                      country={field.country || 'ca'}
                                      required={field.required}
                                    />
                                    <FormHelperText>
                                      {helperText}
                                    </FormHelperText>
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
                                    type="text"
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

                              // number / fallback
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
                      );
                    })}
                  </Grid>
                ))}

                {/* Buttons shown only after the last item */}
                {index === fieldArray.length - 1 && (
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
                      onClick={() => append(makeNewRowInternal())}
                      disabled={!canSubmit || loading}
                    >
                      <Add /> Add Another
                    </CustomButton>

                    {showSubmitButton && (
                      <CustomButton
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!canSubmit || loading} // keep submit protection
                        loading={loading}
                      >
                        Submit All
                      </CustomButton>
                    )}

                    <CustomButton
                      type="button"
                      variant="outlined"
                      color="secondary"
                      onClick={resetForm}
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
  }
);

export default MultiItemForm;
