import { type Dispatch, type SetStateAction } from 'react';
import type { LookupPaginationMeta } from '@features/lookup/state';
import Dropdown, { type OptionType } from '@components/common/Dropdown';

export interface PaginatedDropdownProps<TParams> {
  label?: string;
  value: string | null;
  options: OptionType[];
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  paginationMeta?: LookupPaginationMeta;
  fetchParams: TParams;
  setFetchParams: Dispatch<SetStateAction<TParams>>;
  onChange: (value: string) => void;
  onRefresh: (params: TParams) => void;
  onAddNew?: () => void;
  inputValue?: string;
  onInputChange?: (event: any, newValue: string, reason: string) => void;
  noOptionsMessage?: string;
  helperText?: string;
}

const PaginatedDropdown = <TParams,>({
  label = 'Select',
  value,
  options,
  disabled = false,
  onChange,
  loading,
  error,
  paginationMeta,
  fetchParams,
  setFetchParams,
  onRefresh,
  onAddNew,
  inputValue,
  onInputChange,
  noOptionsMessage,
  helperText,
}: PaginatedDropdownProps<TParams>) => {
  return (
    <Dropdown
      label={label}
      value={value}
      options={options}
      disabled={disabled}
      onChange={onChange}
      loading={loading}
      error={error}
      hasMore={paginationMeta?.hasMore}
      pagination={
        paginationMeta?.limit !== undefined && paginationMeta?.offset !== undefined
          ? { limit: paginationMeta.limit, offset: paginationMeta.offset }
          : undefined
      }
      onRefresh={() => onRefresh(fetchParams)}
      onAddNew={onAddNew}
      onFetchMore={() => {
        const limit = paginationMeta?.limit || 50;
        const currentOffset = paginationMeta?.offset || 0;
        const nextOffset = currentOffset + limit;

        setFetchParams((prev) => ({
          ...prev,
          limit,
          offset: nextOffset,
        }));

        onRefresh({ ...fetchParams, limit, offset: nextOffset });
      }}
      inputValue={inputValue}
      onInputChange={onInputChange}
      noOptionsMessage={loading ? 'Loading...' : noOptionsMessage || 'No options available'}
      helperText={helperText}
    />
  );
};

export default PaginatedDropdown;
