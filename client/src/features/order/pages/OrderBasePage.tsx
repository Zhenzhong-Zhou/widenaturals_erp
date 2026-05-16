import type { SyntheticEvent } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Card, Tab, Tabs } from '@mui/material';
import { CustomTypography } from '@components/index';
import { CreateSaleOrderForm } from '@features/order/components/CreateSaleOrderForm';

const tabs = [
  { label: 'Sales Orders', path: '/orders/sales' },
  { label: 'Purchase Orders', path: '/orders/purchase' },
  { label: 'Transfer Orders', path: '/orders/transfer' },
  { label: 'All Orders', path: '/orders/all' }, // Optional: for admin
];

const OrderBasePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTabIndex = tabs.findIndex((tab) =>
    location.pathname.startsWith(tab.path)
  );

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    const selectedTab = tabs[newValue];
    if (selectedTab) {
      navigate(selectedTab.path);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <CustomTypography variant="h4" gutterBottom>
        Orders
      </CustomTypography>

      <Tabs
        value={currentTabIndex === -1 ? 0 : currentTabIndex}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.path} label={tab.label} />
        ))}
      </Tabs>

      <CreateSaleOrderForm />

      <Card elevation={1} sx={{ p: 2 }}>
        <Outlet />
      </Card>
    </Box>
  );
};

export default OrderBasePage;
