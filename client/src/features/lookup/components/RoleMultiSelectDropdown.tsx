import { type FC } from 'react';
import MultiSelectDropdown, {
  MultiSelectDropdownProps,
} from '@components/common/MultiSelectDropdown';

/**
 * Role-specific multi-select dropdown props.
 *
 * - Inherits all base multi-select behavior
 * - Allows role-specific defaults and future extensions
 */
type RoleMultiSelectDropdownProps = Omit<
  MultiSelectDropdownProps,
  'label' | 'placeholder'
> & {
  label?: string;
  placeholder?: string;
};

/**
 * Reusable multi-select dropdown for selecting roles.
 *
 * Thin wrapper around <MultiSelectDropdown /> to provide
 * semantic clarity and future extension points.
 *
 * Common use cases:
 * - Assigning multiple roles
 * - Permission configuration
 * - Admin setup screens
 */
const RoleMultiSelectDropdown: FC<RoleMultiSelectDropdownProps> = ({
                                                                     label = 'Select Role',
                                                                     options,
                                                                     selectedOptions,
                                                                     onChange,
                                                                     onOpen,
                                                                     loading,
                                                                     disabled,
                                                                     error,
                                                                     helperText,
                                                                     sx,
                                                                     placeholder = 'Choose role…',
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

export default RoleMultiSelectDropdown;
