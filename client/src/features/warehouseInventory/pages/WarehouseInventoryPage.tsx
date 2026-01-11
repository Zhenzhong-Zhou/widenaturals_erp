import { lazy } from 'react';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BaseInventoryPage from '@features/inventoryShared/pages/InventoryListPageBase';
import useWarehouseInventoryAdapter from '@features/warehouseInventory/hooks/useWarehouseInventoryAdapter';
import { WAREHOUSE_INVENTORY_SORT_OPTIONS } from '../constants/sortOptions';
import WarehouseInventoryExpandedRow from '../components/WarehouseInventoryExpandedRow';
import WarehouseInventoryFilterPanel from '../components/WarehouseInventoryFilterPanel';

const WarehouseInventoryTable = lazy(
  () => import('../components/WarehouseInventoryTable')
);

const WarehouseInventoryPage = () => {
  return (
    <BaseInventoryPage
      title="All Warehouse Inventory"
      Icon={<WarehouseIcon fontSize="medium" color="primary" />}
      useInventoryHook={useWarehouseInventoryAdapter}
      FilterPanel={WarehouseInventoryFilterPanel}
      TableComponent={WarehouseInventoryTable}
      ExpandedRowComponent={WarehouseInventoryExpandedRow}
      sortOptions={WAREHOUSE_INVENTORY_SORT_OPTIONS}
      rowKey="id"
      extractGroupName={(record) =>
        record.warehouse?.name || 'Unknown Warehouse'
      }
    />
  );
};

export default WarehouseInventoryPage;
