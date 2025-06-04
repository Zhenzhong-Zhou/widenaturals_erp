import { lazy, useState } from 'react';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import Box from '@mui/material/Box';
import BaseInventoryPage from '@features/inventoryShared/pages/InventoryListPageBase';
import useWarehouseInventory from '@hooks/useWarehouseInventory';
import { WAREHOUSE_INVENTORY_SORT_OPTIONS } from '../constants/sortOptions';
import WarehouseInventoryExpandedRow from '../components/WarehouseInventoryExpandedRow';
import WarehouseInventoryFilterPanel from '../components/WarehouseInventoryFilterPanel';
import CustomButton from '@components/common/CustomButton';
import AddInventoryDialog from '@features/warehouseInventory/components/AddInventoryDialog';

const WarehouseInventoryTable = lazy(
  () => import('../components/WarehouseInventoryTable')
);

const WarehouseInventoryPage = () => {
  const [open, setOpen] = useState(false);

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
      extractGroupName={(record) =>
        record.warehouse?.name || 'Unknown Warehouse'
      }
      topToolbar={
        <Box display="flex" gap={2}>
          <CustomButton
            onClick={(e) => {
              setOpen(true);
              (e.currentTarget as HTMLButtonElement).blur(); // remove focus
            }}
          >
            Add Inventory
          </CustomButton>
          <AddInventoryDialog open={open} onClose={() => setOpen(false)} />
        </Box>
      }
    />
  );
};

export default WarehouseInventoryPage;
