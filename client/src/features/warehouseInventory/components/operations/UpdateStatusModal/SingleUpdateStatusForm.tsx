import type { Dispatch, FC, SetStateAction } from 'react';
import {
  CustomForm,
  CustomTypography,
  Section,
} from '@components/index';
import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';
import type {
  InventoryStatusLookupParams,
  LookupOption,
  LookupPaginationMeta
} from '@features/lookup';
import { buildSingleUpdateStatusFields } from './updateStatusFields';
import { getWarehouseInventoryItemLabel } from './updateStatusItemUtils';
import { formatLabel } from '@utils/textUtils';

interface SingleUpdateStatusFormProps {
  item: FlattenedWarehouseInventory;
  statusOptions: LookupOption[];
  statusLoading: boolean;
  statusError: string | null;
  statusPaginationMeta?: LookupPaginationMeta;
  statusFetchParams: InventoryStatusLookupParams;
  setStatusFetchParams: Dispatch<
    SetStateAction<InventoryStatusLookupParams>
  >;
  fetchStatusOptions: (
    params: InventoryStatusLookupParams
  ) => void | Promise<void>;
  loading: boolean;
  onSubmit: (values: Record<string, any>) => void;
}

/**
 * Single-record variant of the update-status form.
 *
 * Displays the selected record and current status, then renders a simple
 * status update form using CustomForm's built-in submit button.
 */
const SingleUpdateStatusForm: FC<SingleUpdateStatusFormProps> = ({
                                                                   item,
                                                                   statusOptions,
                                                                   statusLoading,
                                                                   statusError,
                                                                   statusPaginationMeta,
                                                                   statusFetchParams,
                                                                   setStatusFetchParams,
                                                                   fetchStatusOptions,
                                                                   loading,
                                                                   onSubmit,
                                                                 }) => (
  <>
    <Section>
      <CustomTypography variant="body2" color="textSecondary">
        {getWarehouseInventoryItemLabel(item)}
      </CustomTypography>
      
      <CustomTypography variant="body2" color="textSecondary">
        Current: {formatLabel(item.statusName)}
      </CustomTypography>
    </Section>
    
    <CustomForm
      fields={buildSingleUpdateStatusFields({
        statusOptions,
        statusLoading,
        statusError,
        statusPaginationMeta,
        statusFetchParams,
        setStatusFetchParams,
        fetchStatusOptions,
      })}
      initialValues={{ statusId: item.statusId ?? '' }}
      onSubmit={onSubmit}
      submitButtonLabel="Update Status"
      disabled={loading || statusLoading}
    />
  </>
);

export default SingleUpdateStatusForm;
