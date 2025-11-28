import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '@context/ThemeContext';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CustomTypography from '@components/common/CustomTypography';
import ErrorMessage from '@components/common/ErrorMessage';
import Loading from '@components/common/Loading';
import {
  CreateSkuBulkForm,
  CreateSkuSingleForm,
  SkuSuccessDialog,
} from '@features/sku/components/CreateSkuForm';
import FormSettingsPanel from '@components/common/FormSettingsPanel';
import SectionDividerLabel from '@components/common/SectionDividerLabel';
import useCreateSkuSharedLogic from '@features/sku/hook/useCreateSkuSharedLogic';
import type { CreateSkuInput } from '@features/sku/state';

const CreateSkuPage = () => {
  const navigate = useNavigate();
  const { theme } = useThemeContext();
  
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // ⚙️ Dynamic toggle states
  const [allowManualBrandCategory, setAllowManualBrandCategory] = useState(false);
  const [allowManualVariantCode, setAllowManualVariantCode] = useState(false);
  const [allowManualRegionCode, setAllowManualRegionCode] = useState(false);
  const [allowManualMarketRegion, setAllowManualMarketRegion] = useState(false);
  
  // -------------------------------------------------------------------------
  // Shared logic
  // -------------------------------------------------------------------------
  const shared = useCreateSkuSharedLogic();
  const {
    createSuccess,
    createError,
    isCreating,
    createdResponse,
    submitCreateSkus,
    resetCreateSkus,
    canCreateSku,
  } = shared;
  
  const handleSubmit = useCallback(
    async (skus: CreateSkuInput[]) => {
      if (!canCreateSku) return;
      await submitCreateSkus({ skus });
    },
    [canCreateSku, submitCreateSkus]
  );
  
  return (
    <Box sx={{ p: 3 }}>
      {/* ----------------------------------------- */}
      {/* HEADER */}
      {/* ----------------------------------------- */}
      <CustomTypography variant="h5" fontWeight={700} mb={2}>
        Create SKUs
      </CustomTypography>
      
      <Tabs value={mode} onChange={(_, v) => setMode(v)} sx={{ mb: 3 }}>
        <Tab label="Single Create" value="single" />
        <Tab label="Bulk Create" value="bulk" />
      </Tabs>
      
      {/* ----------------------------------------- */}
      {/* FORM SETTINGS */}
      {/* ----------------------------------------- */}
      <SectionDividerLabel label="Form Settings" />
      
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.mode === "light" ? "grey.50" : "grey.800",
          border: `1px solid ${
            theme.palette.mode === "light" ? "grey.300" : "grey.700"
          }`,
          mb: 4,
        }}
      >
        <FormSettingsPanel
          settings={[
            {
              id: "brandCategory",
              label: "Manual Brand/Category",
              checked: allowManualBrandCategory,
              onToggle: setAllowManualBrandCategory,
            },
            {
              id: "variantCode",
              label: "Manual Variant Code",
              checked: allowManualVariantCode,
              onToggle: setAllowManualVariantCode,
            },
            {
              id: "regionCode",
              label: "Manual Country Code",
              checked: allowManualRegionCode,
              onToggle: setAllowManualRegionCode,
            },
            {
              id: "marketRegion",
              label: "Manual Market Region",
              checked: allowManualMarketRegion,
              onToggle: setAllowManualMarketRegion,
            },
          ]}
        />
      </Box>
      
      {/* ----------------------------------------- */}
      {/* FORM BODY */}
      {/* ----------------------------------------- */}
      <Box mx={'auto'}>
        {createError && <ErrorMessage message={createError} showNavigation />}
        {createSuccess && createdResponse && (
          <SkuSuccessDialog
            open
            onClose={() => {
              resetCreateSkus();
              navigate('/skus');
            }}
            response={createdResponse}
          />
        )}
        
        {isCreating && (
          <Loading
            variant="dotted"
            message="Loading SKU Creation Form..."
          />
        )}
        
        {mode === 'single' ? (
          <CreateSkuSingleForm
            allowManualBrandCategory={allowManualBrandCategory}
            allowManualVariantCode={allowManualVariantCode}
            allowManualRegionCode={allowManualRegionCode}
            allowManualMarketRegion={allowManualMarketRegion}
            onSubmit={handleSubmit}
            {...shared}
          />
        ) : (
          <CreateSkuBulkForm
            allowManualBrandCategory={allowManualBrandCategory}
            allowManualVariantCode={allowManualVariantCode}
            allowManualRegionCode={allowManualRegionCode}
            allowManualMarketRegion={allowManualMarketRegion}
            onSubmit={handleSubmit}
            {...shared}
          />
        )}
      </Box>
    </Box>
  );
};

export default CreateSkuPage;
