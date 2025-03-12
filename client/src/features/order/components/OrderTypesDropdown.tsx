import { FC } from "react";
import { useOrderTypesDropdown } from "../../../hooks/";
import { Dropdown } from "@components/index.ts";

interface OrderTypeDropdownProps {
  value: string | null;
  onChange: (id: string, name: string) => void;
  label?: string;
  sx?: object;
}

const OrderTypeDropdown: FC<OrderTypeDropdownProps> = ({
                                                         value,
                                                         onChange,
                                                         label = "Select Order Type",
                                                         sx = {},
                                                       }) => {
  const { dropdownOptions, loading, error } = useOrderTypesDropdown();
  
  return (
    <Dropdown
      label={label}
      options={dropdownOptions}
      value={value}
      onChange={(id) => {
        const selectedOption = dropdownOptions.find((option) => option.value === id);
        if (selectedOption) {
          onChange(id, selectedOption.label);
        }
      }}
      searchable={true}
      sx={sx}
      disabled={loading || error !== null} // Disable if loading or error
    />
  );
};

export default OrderTypeDropdown;
