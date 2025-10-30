import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import GoBackButton from '@components/common/GoBackButton';
import ErrorMessage from '@components/common/ErrorMessage';
import Loading from '@components/common/Loading';
import {
  BomHeaderSection,
  BomSummarySection,
  BomDetailsTable,
  BomMaterialSupplySummarySection
} from '@features/bom/components/BomOverview';
import useBomDetails from '@hooks/useBomDetails';
import {
  flattenAllBomMaterialSupplyDetails,
  flattenBomDetails,
  flattenBomHeader,
  flattenBomMaterialSupplySummary,
  flattenBomSummary,
} from '@features/bom/utils/flattenBomOverview';
import useBomMaterialSupplyDetails from '@hooks/useBomMaterialSupplyDetails';
import { mergeBomDetailsWithSupplyDetails } from '@features/bom/utils/mergeBomOverviewData';


const BomOverviewPage = () => {
  const { bomId } = useParams<{ bomId: string }>();
  
  const {
    data: bomDetails,
    summary: bomSummary,
    partCount: bomPartCount,
    loading: isBomLoading,
    error: bomDetailsError,
    hasData: hasBomData,
    fetch: fetchBomDetails,
    reset: resetBomDetails,
  } = useBomDetails();
  
  const {
    loading: isSupplyLoading,
    error: supplyError,
    summary: supplySummary,
    details: supplyDetails,
    hasData: hasSupplyData,
    costOverview: supplyCostOverview,
    selectedBomId: activeBomId,
    fetchDetails: fetchBomSupplyDetails,
    resetDetails: resetBomSupplyDetails,
  } = useBomMaterialSupplyDetails();
  
  // === Early Bailouts ===
  if (!bomId) {
    return <ErrorMessage message="Missing bom ID in URL." />;
  }
  if (bomDetailsError) {
    return <ErrorMessage message={bomDetailsError ?? 'Failed to load boms details.'} />;
  }

  // === Fetch & Refresh Logic: BOM Details ===
  const refreshOverview = useCallback(() => {
    if (bomId) fetchBomDetails(bomId);
  }, [bomId, fetchBomDetails]);
  
  useEffect(() => {
    refreshOverview();
    return () => resetBomDetails();
  }, [refreshOverview, resetBomDetails]);

  // === Fetch & Refresh Logic: BOM Material Supply Details ===
  const refreshMaterialSupply = useCallback(() => {
    if (bomId) fetchBomSupplyDetails(bomId);
  }, [bomId, fetchBomSupplyDetails]);
  
  useEffect(() => {
    refreshMaterialSupply();
    return () => resetBomSupplyDetails();
  }, [refreshMaterialSupply, resetBomSupplyDetails]);
  
  const flattenedHeader = useMemo(() => {
    return bomDetails ? flattenBomHeader(bomDetails.header) : null;
  }, [bomDetails]);
  
  const flattenedSummary = useMemo(() => {
    return bomDetails ? flattenBomSummary(bomSummary) : null;
  }, [bomDetails]);
  
  const flattenedDetails = useMemo(() => {
    return bomDetails ? flattenBomDetails(bomDetails.details) : null;
  }, [bomDetails]);
  
  const flattenedSupplySummary = useMemo(() => {
    return supplySummary ? flattenBomMaterialSupplySummary(supplySummary) : null;
  }, [supplySummary]);
  
  const flattenedSupplyDetails = useMemo(() => {
    return supplyDetails ? flattenAllBomMaterialSupplyDetails(supplyDetails) : null;
  }, [supplyDetails]);
  
  const mergedBomData = useMemo(() => {
    return flattenedDetails && flattenedSupplyDetails
      ? mergeBomDetailsWithSupplyDetails(flattenedDetails, flattenedSupplyDetails)
      : [];
  }, [flattenedDetails, flattenedSupplyDetails]);
  
  // === Loading State ===
  if (
    !hasBomData ||
    isBomLoading ||
    !flattenedHeader ||
    !flattenedSummary ||
    !flattenedDetails
  ) {
    return <Loading message="Loading bom overview..." />;
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <CustomTypography variant="h4" sx={{ mb: 2 }}>
        {flattenedHeader?.bomName} - BOM Information
      </CustomTypography>
      
      {/* Actions Row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
      </Stack>
      
      {/* Order Details */}
      <Card
        sx={{
          maxWidth: 1800,
          mx: 'auto',
          borderRadius: 3,
          boxShadow: 4,
          p: 3,
          mt: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <CardContent>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <CustomTypography variant="h4" sx={{ fontWeight: 'bold' }}>
              BOM Overview
            </CustomTypography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <CustomButton onClick={refreshOverview}>Refresh BOm Details</CustomButton>
            </Stack>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* BOM Details Header Info */}
          {flattenedHeader && <BomHeaderSection flattened={flattenedHeader} />}
          
          {flattenedSummary && <BomSummarySection flattenedSummary={flattenedSummary} />}
          
          {
            flattenedSupplySummary &&
            <BomMaterialSupplySummarySection
              summary={flattenedSupplySummary}
              suppliers={supplySummary.suppliers}
              parts={supplySummary.parts}
            />
          }
          
          {/* Bom Part Items */}
          <BomDetailsTable
            mergedData={mergedBomData}
            itemCount={bomPartCount}
          />
          
          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <CustomButton
              variant="contained"
              color="info"
              href={`/boms`}
            >
              Back to BOM List
            </CustomButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BomOverviewPage;
