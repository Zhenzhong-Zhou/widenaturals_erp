import type { Dispatch, SetStateAction } from 'react';
import type { FieldConfig } from '@components/common/CustomForm';
import StatusDropdown from '@features/lookup/components/StatusDropdown';
import { normalizeLookupParams } from '@features/lookup/utils/lookupUtils';

import type {
  StatusLookupParams,
  StatusLookupOption,
  LookupPaginationMeta,
  LookupQuery,
} from '@features/lookup/state';

interface ProductStatusFieldParams {
  inputValue: string;
  setInputValue: (v: string) => void;

  fetchParams: StatusLookupParams;
  setFetchParams: Dispatch<SetStateAction<LookupQuery>>;

  /** Data from status lookup hook */
  options?: StatusLookupOption[];
  loading?: boolean;
  error?: string | null;
  meta?: LookupPaginationMeta;

  /** Execute lookup */
  fetchStatusDropdownOptions?: (params?: StatusLookupParams) => void;
  onKeywordChange?: (keyword: string) => void;
}

/**
 * Factory: Builds a FieldConfig for selecting a Product Status.
 *
 * Used in:
 * - UpdateProductStatusForm
 * - Any form that needs a product status dropdown
 *
 * This encapsulates:
 * - Keyword-based search
 * - Pagination + offset reset on new keyword
 * - Dynamic fetch parameters
 * - Lookup loading/error state
 * - Refresh behavior
 */
export const createProductStatusField = ({
  inputValue,
  setInputValue,
  fetchParams,
  setFetchParams,
  options = [],
  loading,
  error,
  meta,
  fetchStatusDropdownOptions,
  onKeywordChange,
}: ProductStatusFieldParams): FieldConfig => {
  return {
    id: 'statusId',
    label: 'Product Status',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    customRender: ({ value, onChange }) => (
      <StatusDropdown
        label="Product Status"
        value={value ?? ''}
        onChange={(id) => onChange?.(id)}
        /** keyword input */
        inputValue={inputValue}
        onInputChange={(_e, newInputValue, reason) => {
          // Always update visible text
          setInputValue(newInputValue);

          if (reason !== 'input') return;

          // Update fetch params with the real keyword
          setFetchParams((prev) =>
            normalizeLookupParams({
              ...prev,
              keyword: newInputValue,
              offset: 0,
            })
          );

          // Trigger debounced backend search
          onKeywordChange?.(newInputValue);
        }}
        /** lookup state */
        options={options}
        loading={loading}
        error={error}
        paginationMeta={meta}
        /** pagination & fetch control */
        fetchParams={fetchParams}
        setFetchParams={setFetchParams}
        /** manual reload button */
        onRefresh={(params) =>
          fetchStatusDropdownOptions?.(normalizeLookupParams(params ?? {}))
        }
      />
    ),
  };
};
