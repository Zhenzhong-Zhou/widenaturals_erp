import { type FC, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';
import MultiItemForm, {
  type MultiItemFormRef,
} from '@components/common/MultiItemForm';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';
import { buildBatchFields } from './adjustQuantitiesFields';

interface BatchAdjustFormProps {
  items: FlattenedWarehouseInventory[];
  canAdjustReserved: boolean;
  loading: boolean;
  onSubmit: (rows: Record<string, any>[]) => void;
  onCancel: () => void;
}

interface RowMeta {
  isProduct: boolean;
  name: string | null | undefined;
  code: string | null | undefined;
  lotNumber: string | null | undefined;
  origWarehouse: number;
  origReserved: number;
}

/**
 * Batch variant of the adjust-quantities form.
 *
 * Wraps a scrollable MultiItemForm — one row per selected inventory
 * record — with a sticky footer holding cancel and submit-all actions.
 *
 * Per-row reference data (original quantities, batch metadata used in
 * row titles and the "Original" callout) is held in a sidecar Map
 * keyed by record id rather than mixed into form state. This keeps
 * the form's getItems() result clean — id plus the editable
 * quantities, nothing else — so the payload builder can consume it
 * directly without needing to strip private underscore-prefixed
 * fields.
 */
const BatchAdjustForm: FC<BatchAdjustFormProps> = ({
  items,
  canAdjustReserved,
  loading,
  onSubmit,
  onCancel,
}) => {
  const formRef = useRef<MultiItemFormRef>(null);

  const metaById = useMemo(() => {
    const map = new Map<string, RowMeta>();
    items.forEach((item) => {
      const isProduct = item.batchType === 'product';
      map.set(item.id, {
        isProduct,
        name: isProduct ? item.productName : item.supplierName,
        code: isProduct ? item.sku : item.materialCode,
        lotNumber: isProduct ? item.productLotNumber : item.packagingLotNumber,
        origWarehouse: item.warehouseQuantity,
        origReserved: item.reservedQuantity,
      });
    });
    return map;
  }, [items]);

  const defaultValues = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        warehouseQuantity: item.warehouseQuantity,
        reservedQuantity: item.reservedQuantity,
      })),
    [items]
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
      <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
        <MultiItemForm
          ref={formRef}
          fields={buildBatchFields(canAdjustReserved)}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          loading={loading}
          showSubmitButton={false}
          showAddButton={false}
          showResetButton={false}
          getItemTitle={(_, row) => {
            const meta = metaById.get(row.id);
            if (!meta) return null;
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <CustomTypography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {meta.name ?? '—'}
                </CustomTypography>
                <CustomTypography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace', letterSpacing: 0.2 }}
                >
                  {meta.code} · {meta.isProduct ? 'Product' : 'Packaging'} ·{' '}
                  {meta.lotNumber}
                </CustomTypography>
              </Box>
            );
          }}
          renderBeforeFields={(row) => {
            const meta = metaById.get(row.id);
            if (!meta) return null;
            return (
              <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
                <Box>
                  <CustomTypography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    Original Warehouse
                  </CustomTypography>
                  <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
                    {meta.origWarehouse}
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
                  <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
                    {meta.origReserved}
                  </CustomTypography>
                </Box>
              </Box>
            );
          }}
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
        <CustomButton variant="outlined" onClick={onCancel} disabled={loading}>
          Cancel
        </CustomButton>
        <CustomButton
          variant="contained"
          onClick={() => {
            const rows = formRef.current?.getItems() ?? [];
            onSubmit(rows);
          }}
          disabled={loading}
          loading={loading}
        >
          Submit All
        </CustomButton>
      </Box>
    </Box>
  );
};

export default BatchAdjustForm;
