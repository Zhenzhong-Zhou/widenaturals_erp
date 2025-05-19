import { Tabs, Tab } from '@mui/material';
import type { FC } from 'react';

interface ItemTypeTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
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
