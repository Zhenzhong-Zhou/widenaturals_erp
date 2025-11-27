import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CustomTypography from '@components/common/CustomTypography';
import {
  CreateSkuBulkForm,
  CreateSkuSingleForm,
  SkuSuccessDialog,
} from '@features/sku/components/CreateSkuForm';
import FormSettingsPanel from '@components/common/FormSettingsPanel';
import SectionDividerLabel from '@components/common/SectionDividerLabel';
import useCreateSkuSharedLogic from '@features/sku/hook/useCreateSkuSharedLogic';
import type { CreateSkuInput } from '@features/sku/state';
import ErrorMessage from '@components/common/ErrorMessage';
import Loading from '@components/common/Loading';

const CreateSkuPage = () => {
  const navigate = useNavigate();
  
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
      <CustomTypography variant="h5" fontWeight={700} mb={3}>
        Create SKUs
      </CustomTypography>
      
      <Tabs value={mode} onChange={(_, val) => setMode(val)}>
        <Tab label="Single Create" value="single" />
        <Tab label="Bulk Create" value="bulk" />
      </Tabs>
      
      <SectionDividerLabel label="Form Settings" />
      
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
      
      {/* ------------------- Form Body ------------------- */}
      <Box mt={3}>
        {createError && (
          <ErrorMessage message={createError} showNavigation={true} />
        )}
        
        {createSuccess && createdResponse && (
          <SkuSuccessDialog
            open={true}
            onClose={() => {
              resetCreateSkus();       // optional cleanup
              navigate('/skus');       // or go back to sku list
            }}
            response={createdResponse}
          />
        )}
        
        {isCreating && (
          <Loading
            variant={'dotted'}
            message={"Loading SKU Creation Form..."}
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
