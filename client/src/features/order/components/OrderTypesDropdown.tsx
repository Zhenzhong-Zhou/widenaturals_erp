import type { FC } from 'react';
import useOrderTypesDropdown from '@hooks/useOrderTypesDropdown';
import Dropdown from '@components/common/Dropdown';

interface OrderTypeDropdownProps {
  value: string | null;
  onChange: (id: string, name: string, category: string) => void; // Include category in the onChange callback
  label?: string;
  sx?: object;
  category?: string; // Allow filtering by category
}

const OrderTypeDropdown: FC<OrderTypeDropdownProps> = ({
  value,
  onChange,
  label = 'Select Order Type',
  sx = {},
  category,
}) => {
  const { dropdownOptions, loading, error, refreshOrderTypes } =
    useOrderTypesDropdown(category); // Use category for filtering

  return (
    <>
      <Dropdown
        label={label}
        options={dropdownOptions.map((option) => ({
          value: option.value,
          label: option.label,
        }))} // Map options to maintain structure
        value={value}
        onChange={(id) => {
          const selectedOption = dropdownOptions.find(
            (option) => option.value === id
          );
          if (selectedOption) {
            onChange(id, selectedOption.label, selectedOption.category); // Pass category to parent component
          }
        }}
        searchable={true}
        sx={sx}
        disabled={loading || error !== null}
        onRefresh={refreshOrderTypes}
      />
    </>
  );
};

export default OrderTypeDropdown;
