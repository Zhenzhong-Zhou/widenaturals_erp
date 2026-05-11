import { type FC, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import {
  CustomButton,
} from '@components/index';
import MultiItemForm, {
  type MultiItemFormRef,
} from '@components/common/MultiItemForm';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';
import type { LookupOption } from '@features/lookup';
import { buildBatchUpdateStatusFields } from './updateStatusFields';
import {
  buildUpdateStatusDefaultValues,
} from './updateStatusItemUtils';
import {
  BatchUpdateStatusCurrentStatus,
  type BatchUpdateStatusRowMetaData,
  BatchUpdateStatusRowTitle,
} from '@features/warehouseInventory/components/operations/UpdateStatusModal/BatchUpdateStatusRowMeta';

interface BatchUpdateStatusFormProps {
  items: FlattenedWarehouseInventory[];
  statusOptions: LookupOption[];
  statusLoading: boolean;
  loading: boolean;
  onSubmit: (rows: Record<string, any>[]) => void;
  onCancel: () => void;
}

/**
 * Batch variant of the update-status form.
 *
 * Renders one row per selected inventory record and keeps display-only
 * record metadata in a sidecar Map, so form rows only contain the values
 * needed for the update payload.
 */
const BatchUpdateStatusForm: FC<BatchUpdateStatusFormProps> = ({
                                                                 items,
                                                                 statusOptions,
                                                                 statusLoading,
                                                                 loading,
                                                                 onSubmit,
                                                                 onCancel,
                                                               }) => {
  const formRef = useRef<MultiItemFormRef>(null);
  
  const metaById = useMemo(() => {
    const map = new Map<string, BatchUpdateStatusRowMetaData>();
    
    items.forEach((item) => {
      const isProduct = item.batchType === 'product';
      
      map.set(item.id, {
        isProduct,
        name: isProduct ? item.productName : item.supplierName,
        code: isProduct ? item.sku : item.materialCode,
        lotNumber: isProduct ? item.productLotNumber : item.packagingLotNumber,
        currentStatus: item.statusName,
      });
    });
    
    return map;
  }, [items]);
  
  const defaultValues = useMemo(
    () => buildUpdateStatusDefaultValues(items),
    [items]
  );
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
      <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
        <MultiItemForm
          ref={formRef}
          fields={buildBatchUpdateStatusFields({
            statusOptions,
            statusLoading,
          })}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          loading={loading}
          showSubmitButton={false}
          showAddButton={false}
          showResetButton={false}
          makeNewRow={() => ({})}
          getItemTitle={(_, row) => {
            const meta = metaById.get(row.id);
            return meta ? <BatchUpdateStatusRowTitle meta={meta} /> : null;
          }}
          renderBeforeFields={(row) => {
            const meta = metaById.get(row.id);
            return meta ? <BatchUpdateStatusCurrentStatus meta={meta} /> : null;
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
          disabled={loading || statusLoading}
          loading={loading}
        >
          Submit All
        </CustomButton>
      </Box>
    </Box>
  );
};

export default BatchUpdateStatusForm;
