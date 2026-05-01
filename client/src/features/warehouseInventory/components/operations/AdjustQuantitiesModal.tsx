import { type FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import {
  CustomButton,
  CustomModal,
  CustomTypography,
  ErrorMessage,
  Section,
  SummaryStat,
} from '@components/index';
import type { CustomFormRef } from '@components/common/CustomForm';
import { CustomForm } from '@components/index';
import MultiItemForm, {
  type MultiItemFormRef,
  type MultiItemFieldConfig,
} from '@components/common/MultiItemForm';
import { useWarehouseInventoryAdjustQuantity } from '@hooks/index';
import type {
  FlattenedWarehouseInventory,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdjustQuantitiesModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  /**
   * Single mode (detail page): pass record.
   * Batch mode (list page): pass selectedItems.
   */
  record?: WarehouseInventoryDetailRecord;
  selectedItems?: FlattenedWarehouseInventory[];
  canAdjustReserved?: boolean;
  onSuccess?: (message?: string) => void;
}

type AdjustableQuantities = {
  warehouseQuantity: number;
  reservedQuantity: number;
};

// ─── Batch fields ─────────────────────────────────────────────────────────────

const buildBatchFields = (
  canAdjustReserved: boolean
): MultiItemFieldConfig[] => {
  const fields: MultiItemFieldConfig[] = [
    {
      id: 'warehouseQuantity',
      label: 'Warehouse Qty',
      type: 'number',
      required: true,
      group: 'quantities',
      grid: { xs: 12, sm: 6 },
    },
  ];

  if (canAdjustReserved) {
    fields.push({
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      type: 'number',
      required: false,
      grid: { xs: 12, sm: 6 },
    });
  }

  return fields;
};

// ─── Single fields ────────────────────────────────────────────────────────────

const buildSingleFields = (
  record: AdjustableQuantities,
  canAdjustReserved: boolean
) => {
  const fields = [
    {
      id: 'warehouseQuantity',
      label: 'Warehouse Quantity',
      type: 'number' as const,
      required: true,
      min: 0,
      defaultHelperText: `Current: ${record.warehouseQuantity}`,
    },
  ];

  if (canAdjustReserved) {
    fields.push({
      id: 'reservedQuantity',
      label: 'Reserved Quantity',
      type: 'number' as const,
      required: false,
      min: 0,
      defaultHelperText: `Current: ${record.reservedQuantity}`,
    });
  }

  return fields;
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdjustQuantitiesModal: FC<AdjustQuantitiesModalProps> = ({
  open,
  onClose,
  warehouseId,
  record,
  selectedItems,
  canAdjustReserved = false,
  onSuccess,
}) => {
  const {
    loading,
    error,
    isSuccess,
    adjustResponse,
    adjustQuantities,
    resetAdjustQuantityState,
  } = useWarehouseInventoryAdjustQuantity();

  // Single record source — either explicit prop or first (only) selected item
  const singleRecord =
    record ?? (selectedItems?.length === 1 ? selectedItems[0] : undefined);
  const isBatch = (selectedItems?.length ?? 0) > 1;

  const singleFormRef = useRef<CustomFormRef>(null);
  const batchFormRef = useRef<MultiItemFormRef>(null);

  const handleClose = useCallback(() => {
    resetAdjustQuantityState();
    onClose();
  }, [resetAdjustQuantityState, onClose]);

  useEffect(() => {
    if (!isSuccess) return;
    onSuccess?.(adjustResponse?.message);
    handleClose();
  }, [isSuccess, adjustResponse, onSuccess, handleClose]);

  // ── Batch submit ────────────────────────────────────────────────────────────
  const handleBatchSubmit = (rows: Record<string, any>[]) => {
    void adjustQuantities(warehouseId, {
      updates: rows.map((row) => ({
        id: row.id,
        warehouseQuantity: Number(row.warehouseQuantity),
        ...(canAdjustReserved &&
          row.reservedQuantity !== '' && {
            reservedQuantity: Number(row.reservedQuantity),
          }),
      })),
    });
  };

  // ── Single submit ───────────────────────────────────────────────────────────
  const handleSingleSubmit = (values: Record<string, any>) => {
    if (!singleRecord) return;
    void adjustQuantities(warehouseId, {
      updates: [
        {
          id: singleRecord.id,
          warehouseQuantity: Number(values.warehouseQuantity),
          ...(canAdjustReserved && {
            reservedQuantity: Number(values.reservedQuantity),
          }),
        },
      ],
    });
  };

  // Pre-populate batch rows from selectedItems
  const batchDefaultValues = useMemo(
    () =>
      selectedItems?.map((item) => ({
        id: item.id,
        warehouseQuantity: item.warehouseQuantity,
        reservedQuantity: item.reservedQuantity,
        _origWarehouse: item.warehouseQuantity,
        _origReserved: item.reservedQuantity,
        _meta: {
          isProduct: item.batchType === 'product',
          name:
            item.batchType === 'product' ? item.productName : item.supplierName,
          code: item.batchType === 'product' ? item.sku : item.materialCode,
          lotNumber:
            item.batchType === 'product'
              ? item.productLotNumber
              : item.packagingLotNumber,
        },
      })) ?? [],
    [selectedItems]
  );

  const title = isBatch
    ? `Adjust Quantities — ${selectedItems!.length} records`
    : 'Adjust Quantity';

  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {error && <ErrorMessage message={error} />}

      {isBatch ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '70vh',
          }}
        >
          <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
            <MultiItemForm
              ref={batchFormRef}
              fields={buildBatchFields(canAdjustReserved)}
              defaultValues={batchDefaultValues}
              onSubmit={handleBatchSubmit}
              loading={loading}
              showSubmitButton={false}
              showAddButton={false}
              showResetButton={false}
              getItemTitle={(_, row) => {
                const m = row._meta;
                if (!m) return null;
                return (
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}
                  >
                    <CustomTypography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ lineHeight: 1.2 }}
                    >
                      {m.name ?? '—'}
                    </CustomTypography>
                    <CustomTypography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace', letterSpacing: 0.2 }}
                    >
                      {m.code} · {m.isProduct ? 'Product' : 'Packaging'} ·{' '}
                      {m.lotNumber}
                    </CustomTypography>
                  </Box>
                );
              }}
              renderBeforeFields={(item) => (
                <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                  <Box>
                    <CustomTypography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      Original Warehouse
                    </CustomTypography>
                    <CustomTypography variant="body2" fontWeight={600}>
                      {item._origWarehouse}
                    </CustomTypography>
                  </Box>
                  <Box>
                    <CustomTypography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      Original Reserved
                    </CustomTypography>
                    <CustomTypography variant="body2" fontWeight={600}>
                      {item._origReserved}
                    </CustomTypography>
                  </Box>
                </Box>
              )}
            />
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
              disabled={loading}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="contained"
              onClick={() => {
                const items = batchFormRef.current?.getItems() ?? [];
                handleBatchSubmit(items);
              }}
              disabled={loading}
              loading={loading}
            >
              Submit All
            </CustomButton>
          </Box>
        </Box>
      ) : singleRecord ? (
        <>
          <Section>
            <SummaryStat
              label="Current Warehouse"
              value={singleRecord.warehouseQuantity}
            />
            <SummaryStat
              label="Current Reserved"
              value={singleRecord.reservedQuantity}
            />
            <SummaryStat
              label="Current Available"
              value={singleRecord.availableQuantity}
            />
          </Section>

          <CustomForm
            ref={singleFormRef}
            fields={buildSingleFields(singleRecord, canAdjustReserved)}
            initialValues={{
              warehouseQuantity: singleRecord.warehouseQuantity,
              reservedQuantity: singleRecord.reservedQuantity,
            }}
            onSubmit={handleSingleSubmit}
            submitButtonLabel="Apply Adjustment"
            disabled={loading}
          />
        </>
      ) : null}
    </CustomModal>
  );
};

export default AdjustQuantitiesModal;
