import { type Dispatch, type FC, type SetStateAction } from 'react';
import Dropdown from '@components/common/Dropdown';
import type { GetBatchRegistryDropdownParams } from '../state';

export interface BatchRegistryDropdownProps {
  label?: string;
  value: string | null;
  options: {
    value: string;
    label: string;
  }[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  pagination?: {
    limit: number;
    offset: number;
  };
  fetchParams: GetBatchRegistryDropdownParams;
  setFetchParams: Dispatch<SetStateAction<GetBatchRegistryDropdownParams>>;
  onChange: (value: string) => void;
  onRefresh: (params: GetBatchRegistryDropdownParams) => void;
  onAddNew?: () => void;
}

/**
 * Dropdown component for selecting a batch from the batch registry.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
const BatchRegistryDropdown: FC<BatchRegistryDropdownProps> = ({
                                                                 label = 'Select Batch',
                                                                 value,
                                                                 options,
                                                                 onChange,
                                                                 loading,
                                                                 error,
                                                                 hasMore,
                                                                 pagination,
                                                                 fetchParams,
                                                                 setFetchParams,
                                                                 onRefresh,
                                                                 onAddNew,
                                                               }) => {
  return (
    <Dropdown
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      loading={loading}
      error={error}
      hasMore={hasMore}
      pagination={pagination}
      onRefresh={() => onRefresh?.(fetchParams)}
      onAddNew={onAddNew}
      onFetchMore={() => {
        const limit = pagination?.limit || 50;
        const currentOffset = pagination?.offset || 0;
        const nextOffset = currentOffset + limit;
        
        setFetchParams(prev => ({
          ...prev,
          limit,
          offset: nextOffset,
        }));
        
        onRefresh({ ...fetchParams, limit, offset: nextOffset });
      }}
    />
  );
};

export default BatchRegistryDropdown;
