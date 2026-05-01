import { type FC, useEffect, useRef } from 'react';
import {
  CustomModal,
  CustomForm,
  CustomTypography,
  ErrorMessage,
  Section,
} from '@components/index';
import type { CustomFormRef } from '@components/common/CustomForm';
import MultiItemForm, {
  type MultiItemFormRef,
  type MultiItemFieldConfig,
} from '@components/common/MultiItemForm';
import { useWarehouseInventoryUpdateStatus } from '@hooks/index';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatusOption {
  value: string;
  label: string;
}

interface UpdateStatusModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  /**
   * Single mode (detail page): pass one item.
   * Batch mode (list page): pass multiple items.
   */
  selectedItems: FlattenedWarehouseInventory[];
  statusOptions: StatusOption[];
  onSuccess?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getItemLabel = (item: FlattenedWarehouseInventory): string => {
  if (item.batchType === 'product') {
    const parts = [item.productLotNumber, item.sku, item.productName].filter(
      Boolean
    );
    return parts.join(' · ');
  }
  const parts = [item.packagingLotNumber, item.materialCode].filter(Boolean);
  return parts.join(' · ');
};

// ─── MultiItemForm fields ─────────────────────────────────────────────────────
// todo: label: lot number, sku/code, product name/ packing name , status
const buildBatchFields = (
  statusOptions: StatusOption[]
): MultiItemFieldConfig[] => [
  {
    id: 'label',
    label: 'Record',
    type: 'text',
    disabled: true,
    grid: { xs: 12, sm: 7 },
  },
  {
    id: 'statusId',
    label: 'New Status',
    type: 'select',
    required: true,
    options: statusOptions,
    grid: { xs: 12, sm: 5 },
  },
];

// ─── SingleForm fields ────────────────────────────────────────────────────────
// todo: need to be custom dropdown
const buildSingleFields = (statusOptions: StatusOption[]) => [
  {
    id: 'statusId',
    label: 'New Status',
    type: 'select' as const,
    required: true,
    options: statusOptions,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const UpdateStatusModal: FC<UpdateStatusModalProps> = ({
  open,
  onClose,
  warehouseId,
  selectedItems,
  statusOptions,
  onSuccess,
}) => {
  // todo: need to use all hook params
  const { loading, error, updateResponse, updateStatuses } =
    useWarehouseInventoryUpdateStatus();

  const isBatch = selectedItems.length > 1;

  // single mode ref
  const singleFormRef = useRef<CustomFormRef>(null);
  // batch mode ref
  const batchFormRef = useRef<MultiItemFormRef>(null);

  useEffect(() => {
    if (updateResponse) {
      singleFormRef.current?.resetForm();
      onClose();
      onSuccess?.();
    }
  }, [updateResponse]);

  const handleClose = () => {
    singleFormRef.current?.resetForm();
    onClose();
  };

  // ── Batch submit ────────────────────────────────────────────────────────────
  const handleBatchSubmit = (rows: Record<string, any>[]) => {
    void updateStatuses(warehouseId, {
      updates: rows.map((row) => ({
        id: row.id,
        statusId: row.statusId,
      })),
    });
  };

  // ── Single submit ───────────────────────────────────────────────────────────
  const handleSingleSubmit = (values: Record<string, any>) => {
    const item = selectedItems[0];
    if (!item) return;
    void updateStatuses(warehouseId, {
      updates: [{ id: item.id, statusId: values.statusId }],
    });
  };

  const title = isBatch
    ? `Update Status — ${selectedItems.length} Records`
    : 'Update Status';

  // Pre-populate batch rows from selectedItems
  const batchDefaultValues = selectedItems.map((item) => ({
    id: item.id,
    label: getItemLabel(item),
    statusId: item.statusId,
  }));

  return (
    <CustomModal open={open} onClose={handleClose} title={title}>
      {error && <ErrorMessage message={error} />}

      {isBatch ? (
        <MultiItemForm
          ref={batchFormRef}
          fields={buildBatchFields(statusOptions)}
          defaultValues={batchDefaultValues}
          onSubmit={handleBatchSubmit}
          loading={loading}
          showSubmitButton
          makeNewRow={() => ({})} // no add-row in status update
          getItemTitle={(_, item) => item.label as string}
        />
      ) : (
        <>
          {selectedItems[0] && (
            <Section>
              <CustomTypography variant="body2" color="textSecondary">
                {getItemLabel(selectedItems[0])}
              </CustomTypography>
              <CustomTypography variant="body2" color="textSecondary">
                Current: {selectedItems[0].statusName}
              </CustomTypography>
            </Section>
          )}

          <CustomForm
            ref={singleFormRef}
            fields={buildSingleFields(statusOptions)}
            initialValues={{ statusId: selectedItems[0]?.statusId ?? '' }}
            onSubmit={handleSingleSubmit}
            submitButtonLabel="Update Status"
            disabled={loading}
          />
        </>
      )}
    </CustomModal>
  );
};

export default UpdateStatusModal;
