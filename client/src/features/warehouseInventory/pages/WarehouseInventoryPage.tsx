import { lazy, useEffect, useMemo, useState } from 'react';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BaseInventoryPage from '@features/inventoryShared/pages/InventoryListPageBase';
import useWarehouseInventory from '@hooks/useWarehouseInventory';
import { WAREHOUSE_INVENTORY_SORT_OPTIONS } from '../constants/sortOptions';
import WarehouseInventoryExpandedRow from '../components/WarehouseInventoryExpandedRow';
import WarehouseInventoryFilterPanel from '../components/WarehouseInventoryFilterPanel';
import useBatchRegistryDropdown from '@hooks/useBatchRegistryDropdown';
import Box from '@mui/material/Box';
import BatchRegistryDropdown from '@features/dropdown/components/BatchRegistryDropdown';
import type { BatchRegistryDropdownItem, GetBatchRegistryDropdownParams } from '@features/dropdown/state';
import { formatDate } from '@utils/dateTimeUtils';

const WarehouseInventoryTable = lazy(() => import('../components/WarehouseInventoryTable'));

const WarehouseInventoryPage = () => {
  const [selectedBatch, setSelectedBatch] = useState<{ id: string; type: string } | null>(null);
  const [batchDropdownParams, setBatchDropdownParams] = useState<GetBatchRegistryDropdownParams>({
    batchType: '',
    warehouseId: '',
    locationId:'',
    limit: 50,
    offset: 0,
  });
  
  const {
    items: batchOptions,
    loading,
    error,
    hasMore,
    pagination,
    fetchDropdown,
    resetDropdown,
  } = useBatchRegistryDropdown();
  
  useEffect(() => {
    fetchDropdown({ ...batchDropdownParams, offset: 0 }); // initial load
    return () => {
      resetDropdown();
    };
  }, [fetchDropdown, resetDropdown, batchDropdownParams]);
  
  const dropdownOptions = useMemo(() => {
    const seenValues = new Set<string>();
    
    return batchOptions.reduce(
      (acc: { value: string; label: string }[], item: BatchRegistryDropdownItem) => {
        const optionValue = `${item.id}::${item.type}`;
        
        if (seenValues.has(optionValue)) {
          console.warn(`Duplicate detected: ${optionValue}`);
          return acc; // Skip duplicate
        }
        
        seenValues.add(optionValue);
        
        if (item.type === 'product') {
          const name = item.product?.name ?? 'Unknown Product';
          const lot = item.product?.lotNumber ?? 'N/A';
          const exp = formatDate(item.product?.expiryDate);
          acc.push({
            value: optionValue,
            label: `${name} - ${lot} (Exp: ${exp})`,
          });
        } else if (item.type === 'packaging_material') {
          const name = item.packagingMaterial?.snapshotName ?? 'Unknown Material';
          const lot = item.packagingMaterial?.lotNumber ?? 'N/A';
          const exp = formatDate(item.packagingMaterial?.expiryDate);
          acc.push({
            value: optionValue,
            label: `${name} - ${lot} (Exp: ${exp})`,
          });
        } else {
          acc.push({
            value: optionValue,
            label: 'Unknown Type',
          });
        }
        
        return acc;
      },
      [] // initial value
    );
  }, [batchOptions]);
  
  return (
    <BaseInventoryPage
      title="All Warehouse Inventory"
      Icon={<WarehouseIcon fontSize="medium" color="primary" />}
      useInventoryHook={useWarehouseInventory}
      FilterPanel={WarehouseInventoryFilterPanel}
      TableComponent={WarehouseInventoryTable}
      ExpandedRowComponent={WarehouseInventoryExpandedRow}
      sortOptions={WAREHOUSE_INVENTORY_SORT_OPTIONS}
      rowKey="id"
      extractGroupName={(record) => record.warehouse?.name || 'Unknown Warehouse'}
      topToolbar={
        <Box display="flex" gap={2}>
          <BatchRegistryDropdown
            value={selectedBatch ? `${selectedBatch.id}::${selectedBatch.type}` : null}
            options={dropdownOptions}
            onChange={(value) => {
              if (!value || !value.includes('::')) {
                setSelectedBatch(null);
                return;
              }
              
              const [id, type] = value.split('::');
              if (!id || !type) {
                setSelectedBatch(null);
                return;
              }
              
              setSelectedBatch({ id, type });
            }}
            loading={loading}
            error={error}
            hasMore={hasMore}
            pagination={pagination}
            fetchParams={batchDropdownParams}
            setFetchParams={setBatchDropdownParams}
            onRefresh={fetchDropdown}
            // onAddNew={handleAddNewBatch}
          />
        </Box>
      }
    />
  );
};

export default WarehouseInventoryPage;
