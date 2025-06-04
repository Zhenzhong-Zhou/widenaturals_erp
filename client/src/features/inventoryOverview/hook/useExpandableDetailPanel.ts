import { useState, useEffect, useCallback, startTransition } from 'react';
import { debounce } from '@mui/material';
import { getDetailCacheKey } from '@features/inventoryShared/utils/cacheKeys';

export interface UseExpandableDetailPanelOptions<T> {
  fetchDetail: (params: { itemId: string; page: number; limit: number }) => void;
  detailData?: T[];
  detailError?: string | null;
  detailLoading?: boolean;
}

export const useExpandableDetailPanel = <T>(
  {
    fetchDetail,
    detailData,
    detailError,
    detailLoading,
  }: UseExpandableDetailPanelOptions<T>
) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailLimit, setDetailLimit] = useState(5);
  const [detailCache, setDetailCache] = useState<Record<string, T[]>>({});
  
  useEffect(() => {
    if (expandedRowId && detailData?.length) {
      const cacheKey = getDetailCacheKey(expandedRowId, detailPage, detailLimit);
      
      setDetailCache((prev) => ({
        ...prev,
        [cacheKey]: detailData,
      }));
    }
  }, [detailData, expandedRowId, detailPage, detailLimit]);
  
  useEffect(() => {
    if (!expandedRowId) return;
    
    const cacheKey = getDetailCacheKey(expandedRowId, detailPage, detailLimit);
    if (detailCache[cacheKey]) return;
    
    fetchDetail({ itemId: expandedRowId, page: detailPage, limit: detailLimit });
  }, [expandedRowId, detailPage, detailLimit]);
  
  const handleDrillDownToggle = useCallback(
    debounce((rowId: string) => {
      startTransition(() => {
        setExpandedRowId((prev) => (prev === rowId ? null : rowId));
      });
    }, 150),
    []
  );
  
  const handleRowHover = (rowId: string) => {
    if (!detailCache[rowId]) {
      fetchDetail({ itemId: rowId, page: detailPage, limit: detailLimit });
    }
  };
  
  const handleDetailPageChange = (newPage: number) => {
    setDetailPage(newPage + 1);
  };
  
  const handleDetailRowsPerPageChange = (newLimit: number) => {
    setDetailLimit(newLimit);
    setDetailPage(1);
  };
  
  const detailLoadingMap: Record<string, boolean> = expandedRowId
    ? { [expandedRowId]: !!detailLoading }
    : {};
  
  const detailErrorMap: Record<string, string | null> = expandedRowId && detailError
    ? { [expandedRowId]: detailError }
    : {};
  
  return {
    expandedRowId,
    detailPage,
    detailLimit,
    detailCache,
    detailLoadingMap,
    detailErrorMap,
    handleDrillDownToggle,
    handleRowHover,
    handleDetailPageChange,
    handleDetailRowsPerPageChange,
  };
};
