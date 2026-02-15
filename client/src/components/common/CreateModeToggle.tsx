import type { MouseEvent } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import type { CreateMode } from '@shared-types/shared';

interface CreateModeToggleProps<T extends CreateMode = CreateMode> {
  value: T;
  onChange: (mode: T) => void;
  label?: string; // optional label override (default: Entry Mode)
}

const CreateModeToggle = <T extends CreateMode>({
  value,
  onChange,
  label = 'Entry Mode',
}: CreateModeToggleProps<T>) => {
  const handleChange = (
    _event: MouseEvent<HTMLElement>,
    newValue: T | null
  ) => {
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
      <CustomTypography variant="body1">{label}</CustomTypography>
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

export default CreateModeToggle;
