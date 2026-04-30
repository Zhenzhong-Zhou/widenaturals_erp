import { type FC, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CustomButton,
  CustomModal, CustomTypography,
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
import { Box } from '@mui/material';

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
  onSuccess?: () => void;
}

type AdjustableQuantities = {
  warehouseQuantity: number;
  reservedQuantity: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getItemLabel = (item: FlattenedWarehouseInventory): ReactNode => {
  const isProduct = item.batchType === 'product';
  const name = isProduct ? item.productName : item.supplierName;
  const code = isProduct ? item.sku : item.materialCode;
  const lotNumber = isProduct ? item.productLotNumber : item.packagingLotNumber;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
        <CustomTypography variant="subtitle1" fontWeight={600}>
          {name ?? '—'}
        </CustomTypography>
        <CustomTypography variant="body2" color="text.secondary">
          {code}
        </CustomTypography>
      </Box>
      <CustomTypography variant="caption" color="text.tertiary">
        {isProduct ? 'Product' : 'Packaging'} · {lotNumber}
      </CustomTypography>
    </Box>
  );
};

// ─── Batch fields ─────────────────────────────────────────────────────────────

const buildBatchFields = (canAdjustReserved: boolean): MultiItemFieldConfig[] => {
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
  canAdjustReserved: boolean,
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
    adjustResponse,
    adjustQuantities,
  } = useWarehouseInventoryAdjustQuantity();
  
  // Single record source — either explicit prop or first (only) selected item
  const singleRecord =
    record ?? (selectedItems?.length === 1 ? selectedItems[0] : undefined);
  const isBatch = (selectedItems?.length ?? 0) > 1;
  
  const singleFormRef = useRef<CustomFormRef>(null);
  const batchFormRef = useRef<MultiItemFormRef>(null);
  
  useEffect(() => {
    if (adjustResponse) {
      singleFormRef.current?.resetForm();
      onClose();
      onSuccess?.();
    }
  }, [adjustResponse]);
  
  const handleClose = () => {
    singleFormRef.current?.resetForm();
    onClose();
  };
  
  // ── Batch submit ────────────────────────────────────────────────────────────
  const handleBatchSubmit = (rows: Record<string, any>[]) => {
    void adjustQuantities(warehouseId, {
      updates: rows.map((row) => ({
        id: row.id,
        warehouseQuantity: Number(row.warehouseQuantity),
        ...(canAdjustReserved && row.reservedQuantity !== '' && {
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
  
  // ── Label cache ──────────────────────────────────────────────────────────
  const labelCache = useMemo(() => new WeakMap<object, ReactNode>(), []);
  const cachedLabel = useCallback((item: FlattenedWarehouseInventory) => {
    if (labelCache.has(item)) return labelCache.get(item)!;
    const label = getItemLabel(item);
    labelCache.set(item, label);
    return label;
  }, [labelCache]);
  
  // Pre-populate batch rows from selectedItems
  const batchDefaultValues = useMemo(
    () =>
      selectedItems?.map((item) => ({
        id: item.id,
        label: cachedLabel(item),
        warehouseQuantity: item.warehouseQuantity,
        reservedQuantity: item.reservedQuantity,
        _origWarehouse: item.warehouseQuantity,
        _origReserved: item.reservedQuantity,
      })) ?? [],
    [selectedItems, cachedLabel],
  );
  
  const title = isBatch
    ? `Adjust Quantities — ${selectedItems!.length} records`
    : 'Adjust Quantity';
  
  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {error && <ErrorMessage message={error} />}
      
      {isBatch ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}>
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
              getItemTitle={(_, item) => item.label as string}
              renderBeforeFields={(item) => (
                <Box sx={{ mb: 1, display: 'flex', gap: 2 }}>
                  <CustomTypography variant="body2" color="textSecondary">
                    Original warehouse: <strong>{item._origWarehouse}</strong>
                  </CustomTypography>
                  <CustomTypography variant="body2" color="textSecondary">
                    Original reserved: <strong>{item._origReserved}</strong>
                  </CustomTypography>
                </Box>
              )}
            />
          </Box>
          
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            pt: 2,
            mt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}>
            <CustomButton variant="outlined" onClick={handleClose} disabled={loading}>
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
            <SummaryStat label="Current Warehouse" value={singleRecord.warehouseQuantity} />
            <SummaryStat label="Current Reserved"  value={singleRecord.reservedQuantity} />
            <SummaryStat label="Current Available" value={singleRecord.availableQuantity} />
          </Section>
          
          <CustomForm
            ref={singleFormRef}
            fields={buildSingleFields(singleRecord, canAdjustReserved)}
            initialValues={{
              warehouseQuantity: singleRecord.warehouseQuantity,
              reservedQuantity:  singleRecord.reservedQuantity,
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
