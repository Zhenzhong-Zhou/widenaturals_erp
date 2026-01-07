import { useEffect, useMemo, type SyntheticEvent } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CustomTypography from '@components/common/CustomTypography';
import useVisibleOrderModes from '@features/order/hooks/useVisibleOrderModes';

const OrdersLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const visibleModes = useVisibleOrderModes();
  
  // Redirect to first visible mode if user is on base path (/orders)
  useEffect(() => {
    if (location.pathname !== '/orders') return;
    
    if (visibleModes.length === 0) {
      navigate('/access-denied', { replace: true });
      return;
    }
    
    const [firstMode] = visibleModes;
    if (!firstMode) return;
    
    if (visibleModes.length === 1) {
      navigate(`/orders/${firstMode.key}/all`, { replace: true });
    }
  }, [location.pathname, visibleModes, navigate]);
  
  // Determine the active tab index based on current location
  const activeTabIndex = useMemo(() => {
    return visibleModes.findIndex((mode) =>
      location.pathname.startsWith(`/orders/${mode.key}`)
    );
  }, [location.pathname, visibleModes]);

  const handleTabChange = (_event: SyntheticEvent, newIndex: number) => {
    const selectedMode = visibleModes[newIndex];
    if (selectedMode) {
      navigate(`/orders/${selectedMode.key}/all`);
    }
  };

  return (
    <Box p={3}>
      <CustomTypography variant="h4" gutterBottom>
        Orders
      </CustomTypography>

      <Tabs
        value={activeTabIndex === -1 ? 0 : activeTabIndex}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {visibleModes.map((mode) => (
          <Tab
            key={mode.key}
            label={mode.label}
            onClick={() => {
              const targetPath = `/orders/${mode.key}/all`;
              if (location.pathname !== targetPath) {
                navigate(targetPath);
              }
            }}
          />
        ))}
      </Tabs>

      <Card elevation={1} sx={{ p: 2 }}>
        {location.pathname === '/orders' ? (
          <Box p={2} textAlign="center" color="text.secondary">
            Please select an order view from above.
          </Box>
        ) : (
          <Outlet />
        )}
      </Card>
    </Box>
  );
};

export default OrdersLayout;
