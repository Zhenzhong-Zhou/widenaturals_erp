import { type FC, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CustomDatePicker from '@components/common/CustomDatePicker';
import BaseInput from '@components/common/BaseInput';

export interface PricingTypeFilterParams {
  name?: string;
  startDate?: string;
  endDate?: string;
}

interface PricingTypeFilterPanelProps {
  filters: PricingTypeFilterParams;
  onChange: (updatedFilters: PricingTypeFilterParams) => void;
  onReset?: () => void;
}

const PricingTypeFilterPanel: FC<PricingTypeFilterPanelProps> = ({
                                                                   filters,
                                                                   onChange,
                                                                   onReset,
                                                                 }) => {
  const [localFilters, setLocalFilters] = useState<PricingTypeFilterParams>(filters);
  
  const handleApply = () => {
    onChange(localFilters);
  };
  
  const handleReset = () => {
    const cleared = { name: '', startDate: '', endDate: '' };
    setLocalFilters(cleared);
    onChange(cleared);
    if (onReset) onReset();
  };
  
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        maxWidth: { xs: '100%', sm: '100%', md: 950 },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems="center"
        flexWrap="wrap"
        rowGap={2}
      >
        <BaseInput
          label="Search by Name or Code"
          variant="outlined"
          value={localFilters.name || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, name: e.target.value })}
          size="small"
          sx={{ minWidth: 240 }}
        />
        
        <CustomDatePicker
          label="Start Date"
          value={localFilters.startDate || null}
          onChange={(date) =>
            setLocalFilters({
              ...localFilters,
              startDate: date ? date.toISOString() : '',
            })
          }
          sx={{ maxWidth: 50 }}
        />
        
        <CustomDatePicker
          label="End Date"
          value={localFilters.endDate || null}
          onChange={(date) =>
            setLocalFilters({
              ...localFilters,
              endDate: date ? date.toISOString() : '',
            })
          }
          sx={{ maxWidth: 50 }}
        />
        
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApply}
            sx={{ minWidth: 100 }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            sx={{ minWidth: 100 }}
          >
            Reset
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default PricingTypeFilterPanel;
