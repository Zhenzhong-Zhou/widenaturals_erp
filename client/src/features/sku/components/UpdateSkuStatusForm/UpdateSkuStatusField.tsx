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

interface StatusFieldParams {
  /** Current keyword text inside the dropdown */
  inputValue: string;
  setInputValue: (v: string) => void;

  /** Pagination + query state */
  fetchParams: StatusLookupParams;
  setFetchParams: Dispatch<SetStateAction<LookupQuery>>;

  /** Lookup results */
  options?: StatusLookupOption[];
  loading?: boolean;
  error?: string | null;
  meta?: LookupPaginationMeta;

  /** Trigger backend search */
  fetchStatusDropdownOptions?: (params?: StatusLookupParams) => void;

  /** Optional callback for keyword changes */
  onKeywordChange?: (keyword: string) => void;
}

/**
 * Factory: Builds a FieldConfig for a generic Status dropdown field.
 *
 * This supports:
 * - keyword search
 * - paginated backend lookup
 * - lookup refresh
 * - loading and error states
 * - dynamic label and field id
 *
 * Used by:
 * - UpdateSkuStatusForm
 * - UpdateProductStatusForm
 * - Any form requiring a reusable Status dropdown field
 */
export const createStatusField = ({
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
}: StatusFieldParams): FieldConfig => {
  return {
    id: 'statusId',
    label: 'SKU Status',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    customRender: ({ value, onChange }) => (
      <StatusDropdown
        label="SKU Status"
        value={value ?? ''}
        onChange={(id) => onChange?.(id)}
        // Keyword input
        inputValue={inputValue}
        onInputChange={(_e, newValue, reason) => {
          setInputValue(newValue);

          if (reason !== 'input') return;

          setFetchParams((prev) =>
            normalizeLookupParams({
              ...prev,
              keyword: newValue,
              offset: 0,
            })
          );

          onKeywordChange?.(newValue);
        }}
        options={options}
        loading={loading}
        error={error}
        paginationMeta={meta}
        /** Pagination + fetch state */
        fetchParams={fetchParams}
        setFetchParams={setFetchParams}
        /** Manual reload button */
        onRefresh={(params) =>
          fetchStatusDropdownOptions?.(normalizeLookupParams(params ?? {}))
        }
      />
    ),
  };
};
