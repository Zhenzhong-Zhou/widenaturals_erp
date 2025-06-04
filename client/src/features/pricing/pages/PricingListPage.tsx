import { useEffect, useState, useCallback } from 'react';
import type { FetchPricingParams, PricingRecord } from '@features/pricing/state';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import PricingListTable from '@features/pricing/components/PricingListTable.tsx';
import usePricingList from '@hooks/usePricingList';
import CustomTypography from '@components/common/CustomTypography';
import PricingFilterPanel from '@features/pricing/components/PricingFilterPanel';
import Stack from '@mui/material/Stack';
import CustomModal from '@components/common/CustomModal';
import ExportPricingForm from '../components/ExportPricingForm';
import { extractPricingFilterOptions } from '../utils/extractPricingFilterOptions';
import { useThemeContext } from '@context/ThemeContext';

const PricingListPage = () => {
  const [params, setParams] = useState<FetchPricingParams>({ page: 1, limit: 25 });
  const [exportOpen, setExportOpen] = useState(false);
  const { theme } = useThemeContext();
  
  const {
    data: pricingData,
    pagination,
    isLoading,
    error,
    isEmpty,
    fetchData,
  } = usePricingList(params);
  
  useEffect(() => {
    fetchData(params); // Will only trigger when params change
  }, [params, fetchData]);
  
  const { brands, countryCodes, pricingTypes, sizeLabels } = extractPricingFilterOptions(pricingData);
  
  const handlePageChange = useCallback((newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  }, []);
  
  const handleRowsPerPageChange = useCallback((newLimit: number) => {
    setParams((prev) => ({ ...prev, page: 1, limit: newLimit }));
  }, []);
  
  const handleRefresh = () => {
    fetchData(params); // Refetch current params
  };
  
  const flattened = pricingData.map((item: PricingRecord) => ({
    pricingId: item.pricingId,
    price: item.price,
    pricingTypeId: item.pricingType?.id,
    pricingTypeName: item.pricingType?.name,
    pricingTypeCode: item.pricingType?.code,
    pricingTypeSlug: item.pricingType?.slug,
    productName: item.product?.name,
    productBrand: item.product?.brand,
    productId: item.product?.id,
    skuValue: item.sku?.value,
    skuId: item.sku?.id,
    countryCode: item.sku?.countryCode,
    sizeLabel: item.sku?.sizeLabel,
    barcode: item.sku?.barcode,
    validFrom: item.validFrom,
    validTo: item.validTo,
  }));
  
  if (isLoading) {
    return <Loading message="Fetching pricing records..." />;
  }
  
  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }
  
  return (
    <Box
      sx={{
        padding: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <CustomTypography variant="h4">
        Pricing List
      </CustomTypography>
      
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
        sx={{
          mb: 2,
          backgroundColor: theme.palette.stack,
          borderRadius: 3,
          px: 2,
          py: 1.5,
        }}
      >
        <PricingFilterPanel
          onApply={(newParams: FetchPricingParams) => {
            setParams((prev) => ({
              ...prev,
              filters: newParams.filters ?? {},  // set filters directly
              keyword: newParams.keyword ?? '',  // optional: reset keyword
              page: 1, // reset page
            }));
          }}
          onReset={() => {
            setParams({ page: 1, limit: 25 });
          }}
          brandOptions={brands}
          countryCodeOptions={countryCodes}
          pricingTypeOptions={pricingTypes}
          sizeLabelOptions={sizeLabels}
        />
        <CustomButton variant="outlined" onClick={() => setExportOpen(true)}>
          Export
        </CustomButton>
        <CustomButton onClick={handleRefresh} variant="outlined">
          Refresh
        </CustomButton>
      </Stack>
      
      <CustomModal open={exportOpen} onClose={() => setExportOpen(false)} title="Export Pricing Data">
        <ExportPricingForm
          onClose={() => setExportOpen(false)}
        />
      </CustomModal>
      
      {isEmpty ? (
        <CustomTypography variant={'h6'}>No pricing records found.</CustomTypography>
        ) : (
        <PricingListTable
          data={flattened}
          page={(pagination.page ?? 1) - 1}
          rowsPerPage={pagination.limit}
          totalRecords={pagination.totalRecords}
          totalPages={pagination.totalPages}
          onPageChange={(newPage) => handlePageChange(newPage + 1)}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </Box>
  );
};

export default PricingListPage;
