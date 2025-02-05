import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { WarehouseInventorySummary } from '../state/warehouseInventoryTypes.ts';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

interface WarehouseInventorySummaryCarouselProps {
  inventoriesSummary: WarehouseInventorySummary[];
}

const WarehouseInventorySummaryCard: FC<WarehouseInventorySummaryCarouselProps> = ({ inventoriesSummary }) => {
  const [index, setIndex] = useState(0);
  
  if (inventoriesSummary.length === 0) {
    return <Typography>No warehouse inventory summary available.</Typography>;
  }
  
  const handleNext = () => setIndex((prev) => (prev + 1) % inventoriesSummary.length);
  const handlePrev = () => setIndex((prev) => (prev - 1 + inventoriesSummary.length) % inventoriesSummary.length);
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', maxWidth: 600, margin: 'auto' }}>
      {/* Left Arrow */}
      <IconButton onClick={handlePrev} disabled={inventoriesSummary.length <= 1} sx={{ position: 'absolute', left: 0, zIndex: 1 }}>
        <ArrowBack />
      </IconButton>
      
      {/* Warehouse Summary Card with Hover Animation */}
      <Card
        sx={{
          minWidth: 275,
          padding: 2,
          boxShadow: 3,
          textAlign: 'center',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': { transform: 'scale(1.05)', boxShadow: 6 }, // Hover effect
        }}
      >
        <CardContent>
          {/* 🔗 Clickable Warehouse Name */}
          <Typography variant="h6" gutterBottom>
            <Link
              to={`/warehouses/${inventoriesSummary[index].warehouseId}`}
              style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'bold' }}
            >
              {inventoriesSummary[index].warehouseName}
            </Link>
          </Typography>
          
          <Typography variant="body2" color="textSecondary">Status: {inventoriesSummary[index].status}</Typography>
          <Typography variant="body1">Total Products: {inventoriesSummary[index].totalProducts}</Typography>
          <Typography variant="body1">Reserved Stock: {inventoriesSummary[index].totalReservedStock}</Typography>
          <Typography variant="body1">Available Stock: {inventoriesSummary[index].totalAvailableStock}</Typography>
          <Typography variant="body1">Warehouse Fees: ${inventoriesSummary[index].totalWarehouseFees}</Typography>
        </CardContent>
      </Card>
      
      {/* Right Arrow */}
      <IconButton onClick={handleNext} disabled={inventoriesSummary.length <= 1} sx={{ position: 'absolute', right: 0, zIndex: 1 }}>
        <ArrowForward />
      </IconButton>
    </Box>
  );
};

export default WarehouseInventorySummaryCard;
