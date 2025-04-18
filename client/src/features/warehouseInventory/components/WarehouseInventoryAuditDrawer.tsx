import { type FC, memo, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MetadataSection from '@components/common/MetadataSection';
import type { WarehouseInventoryDetailExtended } from '@features/warehouseInventory';
import { formatDateTime } from '@utils/dateTimeUtils';

interface WarehouseInventoryAuditDrawerProps {
  open: boolean;
  onClose: () => void;
  data: WarehouseInventoryDetailExtended | null;
}

const WarehouseInventoryAuditDrawer: FC<WarehouseInventoryAuditDrawerProps> = ({
                                                                                 open,
                                                                                 onClose,
                                                                                 data,
                                                                               }) => {
  const metadata = useMemo(() => {
    if (!data) return null;
    
    return {
      createdBy: data.lotCreatedBy || 'Unknown',
      createdDate: formatDateTime(data.lotCreatedDate) || 'N/A',
      updatedBy: data.lotUpdatedBy || 'Unknown',
      updatedDate: formatDateTime(data.lotUpdatedDate) || 'N/A',
    };
  }, [data]);
  
  if (!data || !metadata) return null;
  
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" gutterBottom>
          Audit Information
        </Typography>
        
        <Divider />
        
        <MetadataSection data={metadata} />
      </Box>
    </Drawer>
  );
};

export default memo(WarehouseInventoryAuditDrawer);
