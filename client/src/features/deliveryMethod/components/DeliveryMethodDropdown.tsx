import { FC } from 'react';
import Dropdown from '@components/common/Dropdown';
import { useDeliveryMethodDropdown } from '../../../hooks';
import Box from '@mui/material/Box';
import { Loading } from '@components/index.ts';

interface DeliveryMethodDropdownProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  includePickup?: boolean;
  disabled?: boolean;
}

const DeliveryMethodDropdown: FC<DeliveryMethodDropdownProps> = ({
                                                                   label = 'Select Delivery Method',
                                                                   value,
                                                                   onChange,
                                                                   onAddNew,
                                                                   includePickup = false,
                                                                   disabled = false,
                                                                 }) => {
  const { methods, loading, error, refreshMethods } = useDeliveryMethodDropdown(includePickup);
  
  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Loading/>
      </Box>
    );
  }
  
  if (error) {
    return <div>Error loading delivery methods: {error}</div>;
  }
  
  return (
    <Dropdown
      label={label}
      options={methods}
      value={value}
      onChange={onChange}
      onAddNew={onAddNew}
      onRefresh={refreshMethods}
      disabled={disabled}
      searchable
    />
  );
};

export default DeliveryMethodDropdown;
