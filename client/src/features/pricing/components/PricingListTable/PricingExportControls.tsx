/**
 * @file PricingExportControls.tsx
 * @description Export controls for the Pricing list page.
 * Manages export format, status filter, and triggers the export thunk.
 */

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { CustomButton } from '@components/index';
import { StatusDropdown } from '@features/lookup/components';
import { useStatusLookup } from '@hooks/index';
import { useAppDispatch } from '@store/storeHooks';
import { exportPricingThunk } from '@features/pricing/state';
import { useFormattedOptions } from '@features/lookup/utils/lookupUtils';
import { formatLabel } from '@utils/textUtils';
import type { PricingFilters } from '@features/pricing';
import type { LookupQuery } from '@features/lookup';

interface PricingExportControlsProps {
  /** Live filter values from the filter panel — used as export filter context. */
  liveFilters: PricingFilters;
}

const PricingExportControls = ({ liveFilters }: PricingExportControlsProps) => {
  const dispatch = useAppDispatch();
  
  const [exportFormat, setExportFormat]   = useState<'xlsx' | 'csv' | 'txt'>('xlsx');
  const [exportStatusId, setExportStatusId] = useState<string | undefined>();
  const [exportStatusFetchParams, setExportStatusFetchParams] = useState<LookupQuery>({
    offset: 0,
    limit: 10,
  });
  
  const exportStatus = useStatusLookup();
  const formattedExportStatusOptions = useFormattedOptions(exportStatus.options, formatLabel);
  
  const handleExport = useCallback(() => {
    dispatch(exportPricingThunk({
      filters: {
        pricingTypeId: liveFilters.pricingTypeId,
        countryCode:   liveFilters.countryCode,
        brand:         liveFilters.brand,
        productId:     liveFilters.productId,
        statusId:      exportStatusId,
      },
      exportFormat,
    }));
  }, [dispatch, liveFilters, exportFormat, exportStatusId]);
  
  return (
    <Box display="flex" gap={1} alignItems="center">
      <StatusDropdown
        options={formattedExportStatusOptions}
        value={exportStatusId ?? null}
        onChange={setExportStatusId}
        onOpen={() => {
          if (!exportStatus.options.length) exportStatus.fetch(exportStatusFetchParams);
        }}
        loading={exportStatus.loading}
        fetchParams={exportStatusFetchParams}
        setFetchParams={setExportStatusFetchParams}
        onRefresh={exportStatus.fetch}
      />
      
      <Select
        size="small"
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
        sx={{
          borderRadius: 6,
          fontSize: '0.875rem',
          height: 36,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'divider',
          },
        }}
      >
        <MenuItem value="xlsx">XLSX</MenuItem>
        <MenuItem value="csv">CSV</MenuItem>
        <MenuItem value="txt">TXT</MenuItem>
      </Select>
      
      <CustomButton
        onClick={handleExport}
        variant="contained"
        sx={{ fontWeight: 500, borderRadius: 6, height: 36 }}
      >
        Export
      </CustomButton>
    </Box>
  );
};

export default PricingExportControls;
