import { useCallback } from 'react';
import type { ChangeEvent } from 'react';

type BatchType = 'product' | 'packaging_material' | 'all';

interface UseBatchTypeHandlerProps {
  setBatchType: (type: BatchType) => void;
  setBatchLookupParams: (updater: (prev: any) => any) => void;
  resetBatchLookup: () => void;
  fetchBatchLookup: (params: { batchType?: string; offset: number; limit: number }) => void;
}

export const useBatchTypeHandler = ({
                                      setBatchType,
                                      setBatchLookupParams,
                                      resetBatchLookup,
                                      fetchBatchLookup,
                                    }: UseBatchTypeHandlerProps) => {
  const handleBatchTypeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value as BatchType;
      const batchTypeParam = value === 'all' ? undefined : value;
      
      setBatchType(value);
      
      setBatchLookupParams((prev) => ({
        ...prev,
        batchType: batchTypeParam,
        offset: 0,
      }));
      
      resetBatchLookup();
      
      fetchBatchLookup({
        batchType: batchTypeParam,
        offset: 0,
        limit: 50,
      });
    },
    [setBatchType, setBatchLookupParams, resetBatchLookup, fetchBatchLookup]
  );
  
  return { handleBatchTypeChange };
};
