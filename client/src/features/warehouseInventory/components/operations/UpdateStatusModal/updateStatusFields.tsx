import type { Dispatch, SetStateAction } from 'react';
import type {
  FieldConfig,
  CustomRenderParams,
} from '@components/common/CustomForm';
import type {
  MultiItemFieldConfig,
  RowAwareComponentProps,
} from '@components/common/MultiItemForm';
import type {
  InventoryStatusLookupParams,
  LookupOption,
  LookupPaginationMeta,
} from '@features/lookup';
import { InventoryStatusDropdown } from '@features/lookup/components';
import { StatusCell } from '@features/warehouseInventory/components/shared';

interface BuildBatchUpdateStatusFieldsArgs {
  statusOptions: LookupOption[];
  statusLoading: boolean;
}

interface BuildSingleUpdateStatusFieldsArgs {
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
}

/**
 * Builds the row-level field config for bulk inventory status updates.
 *
 * Uses the shared row-aware StatusCell so each MultiItemForm row can update
 * its own statusId while reusing the same status option list.
 */
export const buildBatchUpdateStatusFields = ({
                                               statusOptions,
                                               statusLoading,
                                             }: BuildBatchUpdateStatusFieldsArgs): MultiItemFieldConfig[] => [
  {
    id: 'statusId',
    label: 'New Status',
    type: 'custom',
    required: true,
    component: (props: RowAwareComponentProps<string>) => (
      <StatusCell
        {...props}
        options={statusOptions}
        loading={statusLoading}
      />
    ),
    grid: { xs: 12, sm: 12 },
  },
];

/**
 * Builds the single-record status update field config for CustomForm.
 *
 * Uses InventoryStatusDropdown through CustomForm.customRender because
 * CustomForm does not receive MultiItemForm row-aware component props.
 */
export const buildSingleUpdateStatusFields = ({
                                                statusOptions,
                                                statusLoading,
                                                statusError,
                                                statusPaginationMeta,
                                                statusFetchParams,
                                                setStatusFetchParams,
                                                fetchStatusOptions,
                                              }: BuildSingleUpdateStatusFieldsArgs): FieldConfig[] => [
  {
    id: 'statusId',
    label: 'New Status',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    customRender: ({ value, onChange }: CustomRenderParams) => (
      <InventoryStatusDropdown
        value={value ?? null}
        onChange={(nextValue) => {
          onChange?.(nextValue ?? '');
        }}
        options={statusOptions}
        loading={statusLoading}
        error={statusError}
        paginationMeta={statusPaginationMeta}
        fetchParams={statusFetchParams}
        setFetchParams={setStatusFetchParams}
        onRefresh={fetchStatusOptions}
      />
    ),
  },
];
