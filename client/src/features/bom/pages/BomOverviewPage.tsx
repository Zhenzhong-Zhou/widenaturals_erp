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
  BomMaterialSupplySummarySection,
  BomReadinessSummarySection,
} from '@features/bom/components/BomOverview';
import useBomDetails from '@hooks/useBomDetails';
import useBomMaterialSupplyDetails from '@hooks/useBomMaterialSupplyDetails';
import {
  flattenBomHeader,
  flattenBomSummary,
  flattenBomDetails,
  flattenBomMaterialSupplySummary,
  flattenAllBomMaterialSupplyDetails,
  flattenAllBomReadinessParts,
  flattenBomReadinessMetadata,
} from '@features/bom/utils';
import { mergeBomDetailsWithSupplyAndReadiness } from '@features/bom/utils/mergeBomOverviewData';
import useBomProductionReadiness from '@hooks/useBomProductionReadiness';

const BomOverviewPage = () => {
  const { bomId } = useParams<{ bomId: string }>();

  // === BOM Details Hook ===
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

  // === BOM Material Supply Hook ===
  const {
    loading: isSupplyLoading,
    error: supplyError,
    summary: supplySummary,
    details: supplyDetails,
    hasData: hasSupplyData,
    fetchDetails: fetchBomSupplyDetails,
    resetDetails: resetBomSupplyDetails,
  } = useBomMaterialSupplyDetails();

  // === BOM Material Batch Inventory Hook ===
  const {
    metadata: readinessMetadata,
    parts: readinessParts,
    hasData: hasReadinessData,
    loading: readinessLoading,
    error: readinessError,
    fetchReadiness: fetchBomReadiness,
    resetReadiness: resetBomReadiness,
  } = useBomProductionReadiness();

  // === Early error handling ===
  if (!bomId) {
    return <ErrorMessage message="Missing BOM ID in URL." />;
  }

  // === Fetch BOM Overview ===
  const refreshBomDetails = useCallback(() => {
    if (bomId) fetchBomDetails(bomId);
  }, [bomId, fetchBomDetails]);

  useEffect(() => {
    refreshBomDetails();
    return () => resetBomDetails();
  }, [refreshBomDetails, resetBomDetails]);

  // === Fetch BOM Material Supply Details ===
  const refreshMaterialSupply = useCallback(() => {
    if (bomId) fetchBomSupplyDetails(bomId);
  }, [bomId, fetchBomSupplyDetails]);

  useEffect(() => {
    refreshMaterialSupply();
    return () => resetBomSupplyDetails();
  }, [refreshMaterialSupply, resetBomSupplyDetails]);

  // === Fetch BOM Production Readiness ===
  const refreshProductionReadiness = useCallback(() => {
    if (bomId) fetchBomReadiness(bomId);
  }, [bomId, fetchBomReadiness]);

  useEffect(() => {
    // Fetch on mount or bomId change
    refreshProductionReadiness();

    // Reset only on unmount or when BOM changes
    return () => resetBomReadiness();
  }, [refreshProductionReadiness, resetBomReadiness]);

  // === Data Flattening ===
  const flattenedHeader = useMemo(
    () => (bomDetails ? flattenBomHeader(bomDetails.header) : null),
    [bomDetails]
  );
  const flattenedSummary = useMemo(
    () => (bomSummary ? flattenBomSummary(bomSummary) : null),
    [bomSummary]
  );
  const flattenedDetails = useMemo(
    () => (bomDetails ? flattenBomDetails(bomDetails.details) : null),
    [bomDetails]
  );
  const flattenedSupplySummary = useMemo(
    () =>
      supplySummary ? flattenBomMaterialSupplySummary(supplySummary) : null,
    [supplySummary]
  );
  const flattenedSupplyDetails = useMemo(
    () =>
      supplyDetails ? flattenAllBomMaterialSupplyDetails(supplyDetails) : null,
    [supplyDetails]
  );
  const flattenedReadinessPartRows = useMemo(
    () => (readinessParts ? flattenAllBomReadinessParts(readinessParts) : null),
    [readinessParts]
  );
  const flattenedReadinessMetadata = useMemo(
    () =>
      readinessMetadata ? flattenBomReadinessMetadata(readinessMetadata) : null,
    [readinessMetadata]
  );

  // === Merge BOM & Supply data ===
  const mergedBomData = useMemo(() => {
    return flattenedDetails &&
      flattenedSupplyDetails &&
      flattenedReadinessPartRows
      ? mergeBomDetailsWithSupplyAndReadiness(
          flattenedDetails,
          flattenedSupplyDetails,
          flattenedReadinessPartRows
        )
      : [];
  }, [flattenedDetails, flattenedSupplyDetails, flattenedReadinessPartRows]);

  // === Unified loading state ===
  const isPageLoading =
    isBomLoading ||
    isSupplyLoading ||
    readinessLoading ||
    !hasBomData ||
    !hasSupplyData ||
    !hasReadinessData ||
    !flattenedHeader ||
    !flattenedSummary ||
    !flattenedDetails ||
    !flattenedSupplySummary ||
    !flattenedReadinessMetadata;

  if (isPageLoading) {
    return <Loading message="Loading BOM overview..." />;
  }
  
  if (!supplySummary) {
    return null; // or a defensive fallback
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* === Page Title === */}
      <CustomTypography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        {flattenedHeader?.bomName} — BOM Information
      </CustomTypography>

      {/* === Actions Row === */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
      </Stack>

      {/* === Main Card Container === */}
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
          {/* --- BOM Overview Header Section --- */}
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
              <CustomButton onClick={refreshBomDetails}>
                Refresh BOM Details
              </CustomButton>
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* --- BOM Details Header Section --- */}
          <Box sx={{ mb: 3 }}>
            {isBomLoading ? (
              <Loading message="Loading BOM header..." />
            ) : bomDetailsError ? (
              <ErrorMessage
                message={bomDetailsError ?? 'Failed to load BOM header.'}
              />
            ) : hasBomData && flattenedHeader ? (
              <BomHeaderSection flattened={flattenedHeader} />
            ) : (
              <CustomTypography variant="body2" color="text.secondary">
                No BOM header data available.
              </CustomTypography>
            )}
          </Box>

          {/* --- BOM Summary Section --- */}
          <Box sx={{ mb: 3 }}>
            {isBomLoading ? (
              <Loading message="Loading BOM summary..." />
            ) : bomDetailsError ? (
              <ErrorMessage
                message={bomDetailsError ?? 'Failed to load BOM summary.'}
              />
            ) : hasBomData && flattenedSummary ? (
              <BomSummarySection flattenedSummary={flattenedSummary} />
            ) : (
              <CustomTypography variant="body2" color="text.secondary">
                No BOM summary data available.
              </CustomTypography>
            )}
          </Box>

          {/* --- Supply Summary Section --- */}
          <Box sx={{ mb: 3 }}>
            {isSupplyLoading ? (
              <Loading message="Loading supply summary..." />
            ) : supplyError ? (
              <ErrorMessage
                message={supplyError ?? 'Failed to load BOM supply info.'}
              />
            ) : hasSupplyData && flattenedSupplySummary ? (
              <BomMaterialSupplySummarySection
                isSupplyLoading={isSupplyLoading}
                refreshMaterialSupply={refreshMaterialSupply}
                summary={flattenedSupplySummary}
                suppliers={supplySummary.suppliers}
                parts={supplySummary.parts}
              />
            ) : (
              <CustomTypography variant="body2" color="text.secondary">
                No supply summary data available.
              </CustomTypography>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* --- Inventory Summary Section --- */}
          <Box sx={{ mb: 3 }}>
            {readinessLoading ? (
              <Loading message="Loading batch inventory info..." />
            ) : readinessError ? (
              <ErrorMessage
                message={
                  readinessError ?? 'Failed to load parts inventory info.'
                }
              />
            ) : hasReadinessData && flattenedReadinessMetadata ? (
              <BomReadinessSummarySection
                readinessLoading={readinessLoading}
                refreshProductionReadiness={refreshProductionReadiness}
                flattenedMetadata={flattenedReadinessMetadata}
              />
            ) : (
              <CustomTypography variant="body2" color="text.secondary">
                No batch inventory data available.
              </CustomTypography>
            )}
          </Box>

          {/* --- BOM Details Table Section --- */}
          <Box sx={{ mt: 4 }}>
            {isBomLoading || isSupplyLoading ? (
              <Loading message="Loading detailed records..." />
            ) : bomDetailsError || supplyError ? (
              <ErrorMessage
                message={
                  bomDetailsError ??
                  supplyError ??
                  'Failed to load BOM or supply details.'
                }
              />
            ) : hasBomData && hasSupplyData && mergedBomData.length > 0 ? (
              <BomDetailsTable
                mergedData={mergedBomData}
                itemCount={bomPartCount}
              />
            ) : (
              <CustomTypography variant="body2" color="text.secondary">
                No merged detail data available.
              </CustomTypography>
            )}
          </Box>

          {/* --- Footer --- */}
          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <CustomButton variant="contained" color="info" href="/boms">
              Back to BOM List
            </CustomButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BomOverviewPage;
