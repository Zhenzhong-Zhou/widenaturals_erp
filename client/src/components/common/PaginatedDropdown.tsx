import type { Dispatch, SetStateAction } from 'react';
import type { LookupPaginationMeta } from '@features/lookup/state';
import Dropdown, { type OptionType } from '@components/common/Dropdown';

export interface PaginatedDropdownProps<TParams> {
  label?: string;
  value: string | null;
  options: OptionType[];
  loading?: boolean;
  error?: string | null;
  paginationMeta?: LookupPaginationMeta;
  fetchParams: TParams;
  setFetchParams: Dispatch<SetStateAction<TParams>>;
  onChange: (value: string) => void;
  onRefresh: (params: TParams) => void;
  onAddNew?: () => void;
  inputValue?: string;
  onInputChange?: (event: any, newValue: string) => void;
  noOptionsMessage?: string;
}

const PaginatedDropdown = <TParams,>({
  label = 'Select',
  value,
  options,
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
}: PaginatedDropdownProps<TParams>) => {
  return (
    <Dropdown
      label={label}
      value={value}
      options={options}
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
      noOptionsMessage={noOptionsMessage}
    />
  );
};

export default PaginatedDropdown;
