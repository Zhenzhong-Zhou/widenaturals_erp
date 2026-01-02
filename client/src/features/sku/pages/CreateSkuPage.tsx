import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '@context/ThemeContext';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';
import Loading from '@components/common/Loading';
import FormSettingsPanel from '@components/common/FormSettingsPanel';
import CreateModeToggle from '@components/common/CreateModeToggle';
import SectionDividerLabel from '@components/common/SectionDividerLabel';
import {
  CreateSkuBulkForm,
  CreateSkuSingleForm,
  SkuSuccessDialog,
} from '@features/sku/components/CreateSkuForm';
import useCreateSkuSharedLogic from '@features/sku/hook/useCreateSkuSharedLogic';
import type { CreateSkuInput } from '@features/sku/state';

/**
 * Page: Create SKUs (Single + Bulk)
 *
 * Includes:
 * - permission-aware shared create logic
 * - page-level header + navigation
 * - form settings panel
 * - single/bulk form rendering
 * - success dialog and error/loading handling
 */
const CreateSkuPage = () => {
  const navigate = useNavigate();
  const { theme } = useThemeContext();

  /** Single or bulk create mode */
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  /** Form settings toggles */
  const [allowManualBrandCategory, setAllowManualBrandCategory] =
    useState(false);
  const [allowManualVariantCode, setAllowManualVariantCode] = useState(false);
  const [allowManualRegionCode, setAllowManualRegionCode] = useState(false);
  const [allowManualMarketRegion, setAllowManualMarketRegion] = useState(false);

  /** Shared create-logic hook */
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

  /** Submit handler */
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
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          {/* Title */}
          <CustomTypography variant="h5" fontWeight={700}>
            Create SKUs
          </CustomTypography>

          {/* Right Action Buttons */}
          <Stack direction="row" spacing={2}>
            <GoBackButton sx={{ minWidth: 120 }} />

            <CustomButton
              sx={{ minWidth: 120 }}
              onClick={() => navigate('/skus')}
              variant="outlined"
            >
              Back to SKU List
            </CustomButton>
          </Stack>
        </Stack>
      </Box>

      {/* ----------------------------------------- */}
      {/* MODE TOGGLE (Replaces Tabs) */}
      {/* ----------------------------------------- */}
      <CreateModeToggle
        value={mode}
        onChange={setMode}
        label="SKU Create Mode"
      />

      {/* ----------------------------------------- */}
      {/* FORM SETTINGS */}
      {/* ----------------------------------------- */}
      <SectionDividerLabel label="Form Settings" />

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.800',
          border: `1px solid ${
            theme.palette.mode === 'light' ? 'grey.300' : 'grey.700'
          }`,
          mb: 4,
        }}
      >
        <FormSettingsPanel
          settings={[
            {
              id: 'brandCategory',
              label: 'Manual Brand/Category',
              checked: allowManualBrandCategory,
              onToggle: setAllowManualBrandCategory,
            },
            {
              id: 'variantCode',
              label: 'Manual Variant Code',
              checked: allowManualVariantCode,
              onToggle: setAllowManualVariantCode,
            },
            {
              id: 'regionCode',
              label: 'Manual Country Code',
              checked: allowManualRegionCode,
              onToggle: setAllowManualRegionCode,
            },
            {
              id: 'marketRegion',
              label: 'Manual Market Region',
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
          <Loading variant="dotted" message="Loading SKU Creation Form..." />
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
