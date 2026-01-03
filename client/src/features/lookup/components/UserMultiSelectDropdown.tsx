import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * User-specific multi-select dropdown props.
 *
 * - Inherits all base multi-select behavior
 * - Supports secondary labels (e.g. email) via option rendering
 * - Allows user-specific defaults and future extensions
 */
type UserMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting users.
 *
 * Thin wrapper around <MultiSelectDropdown /> to provide
 * semantic clarity and future extension points.
 */
const UserMultiSelectDropdown: FC<UserMultiSelectDropdownProps> = ({
                                                                     label = 'Select User',
                                                                     options,
                                                                     selectedOptions,
                                                                     onChange,
                                                                     onOpen,
                                                                     loading,
                                                                     disabled,
                                                                     error,
                                                                     helperText,
                                                                     sx,
                                                                     placeholder = 'Choose user…',
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

export default UserMultiSelectDropdown;
