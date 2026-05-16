import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  CustomButton,
  CustomModal,
  CustomTypography,
  ErrorMessage,
} from '@components/index';
import MultiItemForm, {
  type MultiItemFormRef,
} from '@components/common/MultiItemForm';
import {
  useInventoryStatusLookup,
  useWarehouseInventoryCreate,
} from '@hooks/index';
import { composeBatchTitle } from '@features/lookup/utils/batchRegistryUtils';
import { useCreateInventoryBatchLookup } from '@features/warehouseInventory/components/operations/CreateInventoryModal/useCreateInventoryBatchLookup';
import { buildCreateInventoryFields } from './createInventoryFields';
import { buildCreateInventoryPayload } from '@features/warehouseInventory/components/operations/CreateInventoryModal/createInventoryPayload';
import { BatchLookupContext } from './BatchLookupContext';
import type { InventoryStatusLookupParams } from '@features/lookup';
import { useFormattedOptionLabels } from '@features/lookup/utils/formatOptionLabels';

interface CreateInventoryModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  onSuccess?: (message?: string) => void;
}

const CreateInventoryModal: FC<CreateInventoryModalProps> = ({
  open,
  onClose,
  warehouseId,
  onSuccess,
}) => {
  const {
    loading: createLoading,
    error: createError,
    createResponse,
    createdCount,
    createWarehouseInventory,
    resetCreateState,
  } = useWarehouseInventoryCreate();

  const statusLookup = useInventoryStatusLookup();

  const {
    options: statusOptions,
    loading: statusLoading,
    fetch: fetchStatusLookup,
    reset: resetStatusLookup,
  } = statusLookup;

  const [statusFetchParams, setStatusFetchParams] =
    useState<InventoryStatusLookupParams>({
      keyword: '',
      limit: 100,
      offset: 0,
    });

  const { bundle, globalBatchType, pickedBatches, handleBatchTypeChange } =
    useCreateInventoryBatchLookup({ open, warehouseId });

  const formRef = useRef<MultiItemFormRef>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const handledResponseRef = useRef<unknown>(null);

  const handleClose = useCallback(() => {
    resetCreateState();
    onClose();
  }, [resetCreateState, onClose]);

  useEffect(() => {
    if (!createResponse?.success) return;
    if (handledResponseRef.current === createResponse) return;
    handledResponseRef.current = createResponse;

    const noun = globalBatchType === 'product' ? 'product' : 'packaging';
    const message = `Added ${createdCount} ${noun} record${
      createdCount === 1 ? '' : 's'
    }`;
    onSuccessRef.current?.(message);
    handleClose();
  }, [createResponse, createdCount, globalBatchType, handleClose]);

  // Initial fetch on open. Search uses handleStatusSearch (debounced);
  // pagination uses PaginatedDropdown.onFetchMore (calls onRefresh directly).
  // No statusFetchParams in deps — neither path needs an effect to fire fetch.
  useEffect(() => {
    if (!open) return;
    fetchStatusLookup(statusFetchParams);
  }, [open, fetchStatusLookup]);

  // Reset on close only
  useEffect(() => {
    if (open) return;
    resetStatusLookup();
    setStatusFetchParams({ keyword: '', limit: 100, offset: 0 });
  }, [open, resetStatusLookup]);

  const formattedStatusOptions = useFormattedOptionLabels(statusOptions);

  const fields = useMemo(
    () =>
      buildCreateInventoryFields({
        statusOptions: formattedStatusOptions,
        statusLoading,
      }),
    [formattedStatusOptions, statusLoading]
  );

  const onSubmit = useCallback(
    (rows: Record<string, any>[]) => {
      void createWarehouseInventory(
        warehouseId,
        buildCreateInventoryPayload(rows)
      );
    },
    [createWarehouseInventory, warehouseId]
  );

  return (
    <CustomModal
      open={open}
      onClose={handleClose}
      title="Add Inventory Records"
      sx={{ maxWidth: 'md' }}
    >
      {createError && <ErrorMessage message={createError} />}

      <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
            Batch Type
          </CustomTypography>
          <ToggleButtonGroup
            value={globalBatchType}
            exclusive
            size="small"
            onChange={handleBatchTypeChange}
            disabled={createLoading}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="product">Product</ToggleButton>
            <ToggleButton value="packaging_material">
              Packaging Material
            </ToggleButton>
          </ToggleButtonGroup>
          <CustomTypography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 'auto' }}
          >
            Filters the batch picker. Existing selections are preserved.
          </CustomTypography>
        </Box>

        <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
          <BatchLookupContext.Provider value={bundle}>
            <MultiItemForm
              ref={formRef}
              fields={fields}
              onSubmit={onSubmit}
              loading={createLoading}
              showSubmitButton={false}
              showAddButton
              showResetButton={false}
              getItemTitle={(index, item) => {
                const id = item?.batchId as string | undefined;
                const picked = id ? pickedBatches[id] : undefined;
                return picked
                  ? composeBatchTitle(picked)
                  : `Record ${index + 1}`;
              }}
            />
          </BatchLookupContext.Provider>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            pt: 2,
            mt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <CustomButton
            variant="outlined"
            onClick={handleClose}
            disabled={createLoading}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="contained"
            onClick={() => {
              const items = formRef.current?.getItems() ?? [];
              onSubmit(items);
            }}
            disabled={createLoading}
            loading={createLoading}
          >
            Submit All
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
};

export default CreateInventoryModal;
