import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { BatchRegistryDropdown } from '@features/lookup/components';
import type { BatchRegistryForInventoryLookupQuery } from '@features/lookup';
import type { RowAwareComponentProps } from '@components/common/MultiItemForm';
import { BatchLookupContext } from './BatchLookupContext';

/**
 * Single-row batch picker. Reads its lookup state from BatchLookupContext
 * and exposes it as a controlled dropdown wired into MultiItemForm.
 *
 * Maintains a "sticky" view of options so a previously-picked batch
 * survives a global filter change even when the new filter would have
 * excluded it from the live results.
 */
const BatchIdCell = ({
  value,
  onChange,
  rowIndex,
}: RowAwareComponentProps<string>) => {
  const bundle = useContext(BatchLookupContext);
  if (!bundle) return null;

  const {
    inputValues,
    setInputValues,
    fetchParamsArray,
    setFetchParamsArray,
    options,
    loading,
    error,
    paginationMeta,
    fetchOptions,
    defaultQuery,
    pickedBatches,
    cachePickedBatch,
  } = bundle;

  const inputValue = inputValues[rowIndex] ?? '';
  const fetchParams = fetchParamsArray[rowIndex] ?? defaultQuery;

  const setRowFetchParams: Dispatch<
    SetStateAction<BatchRegistryForInventoryLookupQuery>
  > = useCallback(
    (newOrUpdater) => {
      setFetchParamsArray((prev) => {
        const copy = [...prev];
        const current = prev[rowIndex] ?? defaultQuery;

        copy[rowIndex] =
          typeof newOrUpdater === 'function'
            ? (
                newOrUpdater as (
                  p: BatchRegistryForInventoryLookupQuery
                ) => BatchRegistryForInventoryLookupQuery
              )(current)
            : newOrUpdater;

        return copy;
      });
    },
    [rowIndex, setFetchParamsArray, defaultQuery]
  );

  const stickyOptions = useMemo(() => {
    if (!value) return options;
    if (options.some((o) => o.id === value)) return options;
    const cached = pickedBatches[value];
    return cached ? [cached, ...options] : options;
  }, [options, value, pickedBatches]);

  const handleChange = useCallback(
    (id: string) => {
      onChange?.(id);
      if (!id) return;
      const picked = options.find((o) => o.id === id);
      if (picked) cachePickedBatch(picked);
    },
    [onChange, options, cachePickedBatch]
  );

  const handleInputChange = useCallback(
    (_e: unknown, newVal: string) => {
      setInputValues((prev) => {
        const copy = [...prev];
        copy[rowIndex] = newVal;
        return copy;
      });
      setRowFetchParams((prev) => ({ ...prev, keyword: newVal, offset: 0 }));
    },
    [rowIndex, setInputValues, setRowFetchParams]
  );

  return (
    <BatchRegistryDropdown
      label="Select A Batch"
      value={value ?? ''}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={stickyOptions}
      loading={loading}
      error={error}
      paginationMeta={paginationMeta}
      fetchParams={fetchParams}
      setFetchParams={setRowFetchParams}
      onRefresh={fetchOptions}
    />
  );
};

export default BatchIdCell;
