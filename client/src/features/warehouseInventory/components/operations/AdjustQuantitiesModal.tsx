import { type FC, useEffect, useMemo, useRef } from 'react';
import {
  CustomModal,
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
  onSuccess?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getItemLabel = (item: FlattenedWarehouseInventory): string => {
  if (item.batchType === 'product') {
    return [item.productLotNumber, item.sku, item.productName]
      .filter(Boolean)
      .join(' · ');
  }
  return [item.packagingLotNumber, item.materialCode]
    .filter(Boolean)
    .join(' · ');
};

// ─── Batch fields ─────────────────────────────────────────────────────────────

const buildBatchFields = (canAdjustReserved: boolean): MultiItemFieldConfig[] => {
  const fields: MultiItemFieldConfig[] = [
    {
      id: 'label',
      label: 'Record',
      type: 'text',
      disabled: true,
      grid: { xs: 12, sm: canAdjustReserved ? 4 : 6 },
    },
    {
      id: 'warehouseQuantity',
      label: 'Warehouse Qty',
      type: 'number',
      required: true,
      grid: { xs: 12, sm: canAdjustReserved ? 4 : 6 },
    },
  ];
  
  if (canAdjustReserved) {
    fields.push({
      id: 'reservedQuantity',
      label: 'Reserved Qty',
      type: 'number',
      required: false,
      grid: { xs: 12, sm: 4 },
    });
  }
  
  return fields;
};

// ─── Single fields ────────────────────────────────────────────────────────────

const buildSingleFields = (
  record: WarehouseInventoryDetailRecord,
  canAdjustReserved: boolean,
) => {
  const fields = [
    {
      id: 'warehouseQuantity',
      label: 'Warehouse Quantity',
      type: 'number' as const,
      required: true,
      min: 0,
      max: record.warehouseQuantity,
      defaultHelperText: `Max: ${record.warehouseQuantity}`,
    },
  ];
  
  if (canAdjustReserved) {
    fields.push({
      id: 'reservedQuantity',
      label: 'Reserved Quantity',
      type: 'number' as const,
      required: false,
      min: 0,
      max: record.reservedQuantity,
      defaultHelperText: `Max: ${record.reservedQuantity}`,
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
  
  const isBatch = !record && !!selectedItems?.length;
  
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
    if (!record) return;
    void adjustQuantities(warehouseId, {
      updates: [
        {
          id: record.id,
          warehouseQuantity: Number(values.warehouseQuantity),
          ...(canAdjustReserved && {
            reservedQuantity: Number(values.reservedQuantity),
          }),
        },
      ],
    });
  };
  
  // Per-row max validation using the carried quantities
  const batchValidation = useMemo(() => {
    if (!selectedItems) return undefined;
    return () =>
      Object.fromEntries(
        selectedItems.flatMap((item) => [
          [
            'warehouseQuantity',
            (value: any) =>
              Number(value) > item.warehouseQuantity
                ? `Max: ${item.warehouseQuantity}`
                : undefined,
          ],
          ...(canAdjustReserved
            ? [
              [
                'reservedQuantity',
                (value: any) =>
                  value !== '' && Number(value) > item.reservedQuantity
                    ? `Max: ${item.reservedQuantity}`
                    : undefined,
              ],
            ]
            : []),
        ])
      );
  }, [selectedItems, canAdjustReserved]);
  
  // Pre-populate batch rows from selectedItems
  const batchDefaultValues = useMemo(
    () =>
      selectedItems?.map((item) => ({
        id: item.id,
        label: getItemLabel(item),
        warehouseQuantity: item.warehouseQuantity,
        reservedQuantity: item.reservedQuantity,
      })) ?? [],
    [selectedItems],
  );
  
  const title = isBatch
    ? `Adjust Quantities — ${selectedItems?.length} Records`
    : 'Adjust Quantities';
  
  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {error && <ErrorMessage message={error} />}
      
      {isBatch ? (
        <MultiItemForm
          ref={batchFormRef}
          fields={buildBatchFields(canAdjustReserved)}
          defaultValues={batchDefaultValues}
          onSubmit={handleBatchSubmit}
          loading={loading}
          showSubmitButton
          validation={batchValidation}
          getItemTitle={(_, item) => item.label as string}
        />
      ) : record ? (
        <>
          {/* Current quantities — read-only context */}
          <Section>
            <SummaryStat label="Current Warehouse" value={record.warehouseQuantity} />
            <SummaryStat label="Current Reserved" value={record.reservedQuantity} />
            <SummaryStat label="Current Available" value={record.availableQuantity} />
          </Section>
          
          <CustomForm
            ref={singleFormRef}
            fields={buildSingleFields(record, canAdjustReserved)}
            initialValues={{
              warehouseQuantity: record.warehouseQuantity,
              reservedQuantity: record.reservedQuantity,
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
