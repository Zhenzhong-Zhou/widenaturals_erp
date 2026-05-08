import { useMemo } from 'react';
import type {
  UseFormWatch,
  UseFormSetValue,
  PathValue,
  FieldValues,
  Path,
} from 'react-hook-form';
import type { MultiSelectOption } from '@components/common/MultiSelectDropdown';

/**
 * Binds an RHF string[] field to a MultiSelectDropdown.
 *
 * Handles:
 * - watch(field) → derives currently selected options
 * - mapping IDs → options (selected chips)
 * - mapping options → IDs (form value on change)
 * - optional per-option formatting, applied once so the menu list and
 *   the selected chips share the same shape
 *
 * Returns:
 * - options: the formatted list (or the raw list when no formatter is given)
 * - selectedOptions: subset of `options` matching the current RHF value
 * - handleSelect: writes the new ID list back to RHF with shouldDirty,
 *   or undefined when the selection is empty
 */
const useMultiSelectBinding =<
  TFormValues extends FieldValues,
  TFieldName extends Path<TFormValues>,
>({
    watch,
    setValue,
    fieldName,
    options,
    formatOption,
  }: {
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  fieldName: TFieldName;
  options: MultiSelectOption[];
  formatOption?: (option: MultiSelectOption) => MultiSelectOption;
}) => {
  // Apply formatter once at the source so options and selectedOptions stay aligned.
  const formattedOptions = useMemo(() => {
    if (!formatOption) return options;
    return options.map(formatOption);
  }, [options, formatOption]);
  
  // RHF-safe read
  const ids = watch(fieldName) as
    | PathValue<TFormValues, TFieldName>
    | undefined;
  
  const selectedOptions = useMemo<MultiSelectOption[]>(() => {
    if (!Array.isArray(ids)) return [];
    return formattedOptions.filter((opt) => ids.includes(opt.value));
  }, [ids, formattedOptions]);
  
  const handleSelect = (selected: MultiSelectOption[]) => {
    const values = selected.map((o) => o.value);
    
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
    options: formattedOptions,
    selectedOptions,
    handleSelect,
  };
};

export default useMultiSelectBinding;
