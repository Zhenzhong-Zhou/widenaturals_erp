import { useMemo } from 'react';
import type {
  UseFormWatch,
  UseFormSetValue,
  PathValue,
  FieldValues,
  Path
} from 'react-hook-form';
import type { MultiSelectOption } from '@components/common/MultiSelectDropdown';

/**
 * Binds an RHF string[] field to a MultiSelectDropdown.
 *
 * Handles:
 * - watch(field)
 * - mapping IDs → options
 * - mapping options → IDs
 */
const useMultiSelectBinding = <
  TFormValues extends FieldValues,
  TFieldName extends Path<TFormValues>
>({
    watch,
    setValue,
    fieldName,
    options,
  }: {
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  fieldName: TFieldName;
  options: MultiSelectOption[];
}) => {
  // RHF-safe read
  const ids = watch(fieldName) as PathValue<TFormValues, TFieldName> | undefined;
  
  const selectedOptions = useMemo<MultiSelectOption[]>(() => {
    if (!Array.isArray(ids)) return [];
    return options.filter(opt => ids.includes(opt.value));
  }, [ids, options]);
  
  const handleSelect = (selected: MultiSelectOption[]) => {
    const values = selected.map(o => o.value);
    
    setValue(
      fieldName,
      (values.length ? values : undefined) as PathValue<
        TFormValues,
        TFieldName
      >,
      { shouldDirty: true }
    );
  };
  
  return {
    selectedOptions,
    handleSelect,
  };
};

export default useMultiSelectBinding;
