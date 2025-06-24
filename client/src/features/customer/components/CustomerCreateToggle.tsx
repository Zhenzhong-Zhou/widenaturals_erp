import type { MouseEvent } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import type { CustomerCreateMode } from '@features/customer/state';

interface CustomerCreateToggleProps {
  value: CustomerCreateMode;
  onChange: (mode: CustomerCreateMode) => void;
}

const CustomerCreateToggle = ({ value, onChange }: CustomerCreateToggleProps) => {
  const handleChange = (
    _event: MouseEvent<HTMLElement>,
    newValue: CustomerCreateMode | null
  ) => {
    if (newValue) {
      onChange(newValue);
    }
  };
  
  return (
    <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
      <CustomTypography variant="body1">
        Entry Mode
      </CustomTypography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        size="small"
        color="primary"
      >
        <ToggleButton value="single">Single</ToggleButton>
        <ToggleButton value="bulk">Bulk</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default CustomerCreateToggle;
