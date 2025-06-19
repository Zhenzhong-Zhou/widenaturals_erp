import { lazy } from 'react';
import StoreIcon from '@mui/icons-material/Store';
import BaseInventoryPage from '@features/inventoryShared/pages/InventoryListPageBase';
import useLocationInventory from '@hooks/useLocationInventory';
import { LOCATION_INVENTORY_SORT_OPTIONS } from '../constants/sortOptions';
import LocationInventoryExpandedRow from '../components/LocationInventoryExpandedRow';
import LocationInventoryFilterPanel from '../components/LocationInventoryFilterPanel';

const LocationInventoryTable = lazy(
  () => import('../components/LocationInventoryTable')
);

const LocationInventoryPage = () => {
  return (
    <BaseInventoryPage
      title="All Location Inventory"
      Icon={<StoreIcon fontSize="medium" color="primary" />}
      useInventoryHook={useLocationInventory}
      FilterPanel={LocationInventoryFilterPanel}
      TableComponent={LocationInventoryTable}
      ExpandedRowComponent={LocationInventoryExpandedRow}
      sortOptions={LOCATION_INVENTORY_SORT_OPTIONS}
      rowKey="id"
      extractGroupName={(record) => record.location?.name || 'Unknown Location'}
    />
  )
};

export default LocationInventoryPage;
