import type { FC, SyntheticEvent } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

interface ItemTypeTabsProps {
  value: number;
  onChange: (event: SyntheticEvent, newValue: number) => void;
}

const ItemTypeTabs: FC<ItemTypeTabsProps> = ({ value, onChange }) => (
  <Tabs
    value={value}
    onChange={onChange}
    sx={{ mt: 2 }}
    aria-label="Item Type Tabs"
  >
    <Tab label="All" />
    <Tab label="Products" />
    <Tab label="Materials" />
  </Tabs>
);

export default ItemTypeTabs;
