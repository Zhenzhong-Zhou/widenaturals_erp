import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  useForm,
  useFieldArray,
  type Control,
  useFormState,
} from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { Box, Grid } from '@mui/material';
import { MultiItemRow } from '@components/index';

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
  getItemTitle?: (index: number, item: Record<string, any>) => ReactNode;
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
  itemsPerRow?: number;
  showAddButton?: boolean;
  showResetButton?: boolean;
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
      showAddButton = true,
      showResetButton = true,
      itemsPerRow = 1,
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
    
    const { isValid } = useFormState({ control });
    
    // const allFields = useWatch({ control, name: 'items' }) as Record<string, any>[];

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
    
    const handleResetItem = useCallback(
      (index: number) => {
        remove(index);
        insert(index, makeNewRowInternal());
      },
      [remove, insert, makeNewRowInternal]
    );
    
    const handleRemoveItem = useCallback(
      (id: string) => {
        const i = fieldArray.findIndex((item) => item.id === id);
        if (i !== -1) remove(i);
      },
      [fieldArray, remove]
    );
    
    const handleAddItem = useCallback(
      () => append(makeNewRowInternal()),
      [append, makeNewRowInternal]
    );
    
    const handleResetForm = useCallback(
      () => reset({ items: [makeNewRowInternal()] }),
      [reset, makeNewRowInternal]
    );
    
    const groupedFields = useMemo(() => {
      const groups: Record<string, MultiItemFieldConfig[]> = {};
      fields.forEach((field) => {
        const groupKey = field.group ?? `__single__${field.id}`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(field);
      });
      return Object.values(groups);
    }, [fields]);

    const prepareFormDataForSubmit = (formData: {
      items: Record<string, any>[];
    }) => {
      return {
        ...formData,
        items: formData.items.map(
          ({ line_type, show_barcode_toggle, label, ...rest }) => rest
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
    
    return (
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ maxWidth: '95vw', margin: 'auto' }}>
        {itemsPerRow > 1 ? (
          <Grid container spacing={4}>
            {fieldArray.map((field, index) => (
              <Grid key={field.fieldKey} size={{ xs: 12, md: 12 / itemsPerRow }}>
                <MultiItemRow
                  index={index}
                  fieldArrayItem={field}
                  isLast={index === fieldArray.length - 1}
                  fieldArrayLength={fieldArray.length}
                  groupedFields={groupedFields}
                  defaultValues={defaultValues}
                  validationRules={validationRules}
                  control={control}
                  getValues={getValues}
                  setValue={setValue}
                  onResetItem={handleResetItem}
                  onRemoveItem={handleRemoveItem}
                  onAddItem={handleAddItem}
                  onResetForm={handleResetForm}
                  getItemTitle={getItemTitle}
                  renderBeforeFields={renderBeforeFields}
                  showAddButton={showAddButton}
                  showSubmitButton={showSubmitButton}
                  showResetButton={showResetButton}
                  canSubmit={isValid}
                  loading={loading}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {fieldArray.map((field, index) => (
              <MultiItemRow
                key={field.fieldKey}
                index={index}
                fieldArrayItem={field}
                isLast={index === fieldArray.length - 1}
                fieldArrayLength={fieldArray.length}
                groupedFields={groupedFields}
                defaultValues={defaultValues}
                validationRules={validationRules}
                control={control}
                getValues={getValues}
                setValue={setValue}
                onResetItem={handleResetItem}
                onRemoveItem={handleRemoveItem}
                onAddItem={handleAddItem}
                onResetForm={handleResetForm}
                getItemTitle={getItemTitle}
                renderBeforeFields={renderBeforeFields}
                showAddButton={showAddButton}
                showSubmitButton={showSubmitButton}
                showResetButton={showResetButton}
                canSubmit={isValid}
                loading={loading}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }
);

export default MultiItemForm;
