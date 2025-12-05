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
  inputValue: string;
  setInputValue: (v: string) => void;
  fetchParams: StatusLookupParams;
  setFetchParams: Dispatch<SetStateAction<LookupQuery>>;
  
  /** Data from lookup hook */
  options?: StatusLookupOption[];
  loading?: boolean;
  error?: string | null;
  meta?: LookupPaginationMeta;
  
  /** Fetch + refresh */
  fetchStatusDropdownOptions?: (params?: StatusLookupParams) => void;
}

/**
 * Factory: Builds a FieldConfig for the Status dropdown field.
 *
 * This encapsulates all StatusDropdown logic:
 * - keyword input
 * - pagination fetch params
 * - refresh handling
 * - lookup errors + loading
 * - memo-safe callback setup
 *
 * Used by:
 * - UpdateSkuStatusForm
 * - Any page that needs a reusable SKU/Status dropdown field
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
                                  }: StatusFieldParams): FieldConfig => {
  return {
    id: 'status_id',
    label: 'SKU Status',
    type: 'custom',
    required: true,
    grid: { xs: 12 },
    customRender: ({ value, onChange }) => (
      <StatusDropdown
        label="SKU Status"
        value={value ?? ''}
        onChange={(id) => onChange?.(id)}
        inputValue={inputValue}
        onInputChange={(_e, val) => {
          setInputValue(val);
          setFetchParams((prev) =>
            normalizeLookupParams({
              ...prev,
              keyword: val,
              offset: 0,
            })
          );
        }}
        options={options}
        loading={loading}
        error={error}
        paginationMeta={meta}
        fetchParams={fetchParams}
        setFetchParams={setFetchParams}
        onRefresh={(params) =>
          fetchStatusDropdownOptions?.(normalizeLookupParams(params ?? {}))
        }
      />
    ),
  };
};