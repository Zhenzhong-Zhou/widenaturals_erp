import { memo, type ReactNode } from 'react';
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type UseFormGetValues,
  type UseFormSetValue
} from 'react-hook-form';
import type { MultiItemFieldConfig } from './MultiItemForm';
import {
  Box,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import ReplayIcon from '@mui/icons-material/Replay';
import Delete from '@mui/icons-material/Delete';
import {
  BaseInput,
  CustomButton,
  CustomDatePicker,
  CustomPhoneInput,
  Dropdown
} from '@components/index';

type ItemsForm = { items: Record<string, any>[] };

interface MultiItemRowProps {
  index: number;
  fieldArrayItem: FieldArrayWithId<ItemsForm, 'items', 'fieldKey'>;
  isLast: boolean;
  fieldArrayLength: number;
  groupedFields: MultiItemFieldConfig[][];
  defaultValues: Record<string, any>[];
  validationRules: Record<string, (value: any) => string | undefined>;
  control: Control<ItemsForm>;
  getValues: UseFormGetValues<ItemsForm>;
  setValue: UseFormSetValue<ItemsForm>;
  // handlers
  onResetItem: (index: number) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  onResetForm: () => void;
  // display props
  getItemTitle?: (index: number, item: Record<string, any>) => ReactNode;
  renderBeforeFields?: (item: Record<string, any>, index: number) => ReactNode;
  // button visibility
  showAddButton: boolean;
  showSubmitButton: boolean;
  showResetButton: boolean;
  canSubmit: boolean;
  loading?: boolean;
}

const MultiItemRow = memo(function MultiItemRow({
                                                  index,
                                                  fieldArrayItem,
                                                  isLast,
                                                  fieldArrayLength,
                                                  groupedFields,
                                                  defaultValues,
                                                  validationRules,
                                                  control,
                                                  getValues,
                                                  setValue,
                                                  onResetItem,
                                                  onRemoveItem,
                                                  onAddItem,
                                                  onResetForm,
                                                  getItemTitle,
                                                  renderBeforeFields,
                                                  showAddButton,
                                                  showSubmitButton,
                                                  showResetButton,
                                                  canSubmit,
                                                  loading,
                                                }: MultiItemRowProps) {
  const rowSnapshot = getValues(`items.${index}`) ?? {};
  
  return (
    <Grid
        key={fieldArrayItem.fieldKey}
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
            alignItems: 'flex-start',
            padding: '4px',
            gap: 1,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              fontWeight: 600,
            }}
          >
            {getItemTitle?.(index, rowSnapshot) ?? `Item ${index + 1}`}
          </Box>
          <Box sx={{ display: 'flex', flexShrink: 0 }}>
            <IconButton
              onClick={() => onResetItem(index)}
              color="primary"
              title="Reset this item"
            >
              <ReplayIcon />
            </IconButton>
            
            {fieldArrayLength > 1 && (
              <IconButton onClick={() => onRemoveItem(fieldArrayItem.id)} color="error">
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>
      
        {renderBeforeFields?.(rowSnapshot, index)}

        {/* Form Fields (Stacked in Vertical Layout Inside Each Form) */}
        {groupedFields.map((group, gIdx) => (
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
                        const setRowValues = (next: Record<string, any>) =>
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
                              control: control as Control<any>,
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
      {isLast && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start', marginTop: 2 }}>
          {showAddButton && (
            <CustomButton
              type="button"
              variant="outlined"
              onClick={onAddItem}
              disabled={!canSubmit || loading}
            >
              <Add /> Add Another
            </CustomButton>
          )}
          {showSubmitButton && (
            <CustomButton
              type="submit"
              variant="contained"
              color="primary"
              disabled={!canSubmit || loading}
              loading={loading}
            >
              Submit All
            </CustomButton>
          )}
          {showResetButton && (
            <CustomButton
              type="button"
              variant="outlined"
              color="secondary"
              onClick={onResetForm}
              disabled={loading}
            >
              Reset Form
            </CustomButton>
          )}
        </Box>
      )}
    </Grid>
  );
});

export default MultiItemRow;
