import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * Packaging-material–specific multi-select dropdown props.
 *
 * - Inherits all base multi-select behavior
 * - Allows packaging-material–specific defaults and future extensions
 */
type PackagingMaterialMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting packaging materials.
 *
 * Thin wrapper around <MultiSelectDropdown /> to provide
 * semantic clarity and future extension points (e.g. supplier,
 * material type, code, compliance flags).
 */
const PackagingMaterialMultiSelectDropdown: FC<
  PackagingMaterialMultiSelectDropdownProps
> = ({
       label = 'Select Packaging Material',
       options,
       selectedOptions,
       onChange,
       onOpen,
       loading,
       disabled,
       error,
       helperText,
       sx,
       placeholder = 'Choose packaging material…',
       paginationMeta,
       inputValue,
       onInputChange,
     }) => {
  return (
    <MultiSelectDropdown
      label={label}
      options={options}
      selectedOptions={selectedOptions}
      onChange={onChange}
      onOpen={onOpen}
      loading={loading}
      disabled={disabled}
      error={error}
      helperText={helperText}
      sx={sx}
      placeholder={placeholder}
      paginationMeta={paginationMeta}
      inputValue={inputValue}
      onInputChange={onInputChange}
    />
  );
};

export default PackagingMaterialMultiSelectDropdown;
