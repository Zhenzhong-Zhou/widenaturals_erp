import {
  type FC,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  Chip,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs
} from '@mui/material';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  Loading,
  NoDataFound,
} from '@components/index';
import {
  WarehouseInventoryActivityLogPanel,
  WarehouseInventoryKpiRow,
  WarehouseInventoryMetaPanel,
  WarehouseInventoryMovementsTable,
  WarehouseInventoryPackagingInfoPanel,
  WarehouseInventoryProductInfoPanel,
  WarehouseInventoryZonesTable,
} from '@features/warehouseInventory/components/WarehouseInventoryDetail';
import { useWarehouseInventoryDetail } from '@hooks/index';
import { formatLabel } from '@utils/textUtils';

type DetailTab = 'zones' | 'movements' | 'activity';

/**
 * Full detail page for a single warehouse inventory record.
 *
 * Renders header with batchType/status badges and KPI quantities,
 * a two-column body with product/packaging info on the left and
 * dates/audit on the right, and a tab strip for zones, movements,
 * and the lazy-fetched activity log.
 *
 * Route param: inventoryId (UUID)
 */
const WarehouseInventoryDetailPage: FC = () => {
  const { warehouseId, inventoryId } = useParams<{
    warehouseId: string;
    inventoryId: string;
  }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('zones');
  
  const {
    data,
    loading,
    error,
    productInfo,
    packagingInfo,
    zones,
    movements,
    audit,
    fetchDetail,
    resetDetail,
  } = useWarehouseInventoryDetail();
  
  // -----------------------------
  // Fetch on mount
  // -----------------------------
  useEffect(() => {
    if (warehouseId && inventoryId) {
      fetchDetail(warehouseId, inventoryId);
    }
    
    return () => {
      resetDetail();
    };
  }, [warehouseId, inventoryId]);
  
  // -----------------------------
  // Event handlers
  // -----------------------------
  const handleRefresh = useCallback(() => {
    if (warehouseId && inventoryId) {
      fetchDetail(warehouseId, inventoryId);
    }
  }, [warehouseId, inventoryId, fetchDetail]);
  
  const handleTabChange = (_e: SyntheticEvent, next: DetailTab) => {
    setActiveTab(next);
  };
  
  // -----------------------------
  // Loading / error / empty
  // -----------------------------
  if (loading) {
    return <Loading variant="dotted" message="Loading inventory record..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} showNavigation />;
  }
  
  if (!data) {
    return <NoDataFound message="Warehouse inventory record not found." />;
  }
  
  // -----------------------------
  // Derived header title (lot# for product, displayName for packaging)
  // -----------------------------
  const headerTitle =
    data.batchType === 'product'
      ? (productInfo?.batch.lotNumber ?? '—')
      : (packagingInfo?.batch.displayName ??
        packagingInfo?.batch.lotNumber ??
        '—');
  
  const batchTypeLabel =
    data.batchType === 'product' ? 'Product' : 'Packaging Material';
  
  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* --------------------------------------------------
       * Header — badges + title + refresh
       * -------------------------------------------------- */}
      <Box mb={3}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Chip
            label={batchTypeLabel}
            size="small"
            color={data.batchType === 'product' ? 'primary' : 'secondary'}
          />
          <Chip label={formatLabel(data.status.name)} size="small" variant="outlined" />
        </Stack>
        
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <CustomTypography variant="h5" fontWeight={600}>
            {headerTitle}
          </CustomTypography>
          <CustomButton variant="outlined" onClick={handleRefresh}>
            Refresh
          </CustomButton>
        </Box>
      </Box>
      
      {/* --------------------------------------------------
       * KPI Row — warehouse / reserved / available
       * -------------------------------------------------- */}
      <WarehouseInventoryKpiRow
        warehouseQuantity={data.warehouseQuantity}
        reservedQuantity={data.reservedQuantity}
        availableQuantity={data.availableQuantity}
      />
      
      <Divider sx={{ my: 3 }} />
      
      {/* --------------------------------------------------
       * Main Body — 2 columns
       * -------------------------------------------------- */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          {data.batchType === 'product' ? (
            <WarehouseInventoryProductInfoPanel info={data.productInfo} />
          ) : (
            <WarehouseInventoryPackagingInfoPanel info={data.packagingInfo} />
          )}
          
          <Card sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <CustomTypography variant="subtitle1" fontWeight={600} mb={1.5}>
              Warehouse Details
            </CustomTypography>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <CustomTypography color="text.secondary">
                  Warehouse fee
                </CustomTypography>
                <CustomTypography>{data.warehouseFee}</CustomTypography>
              </Box>
              <Box display="flex" justifyContent="space-between" gap={2}>
                <CustomTypography color="text.secondary">
                  Batch note
                </CustomTypography>
                <CustomTypography sx={{ textAlign: 'right' }}>
                  {data.batchNote ?? '—'}
                </CustomTypography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 5 }}>
          <WarehouseInventoryMetaPanel
            inboundDate={data.inboundDate}
            outboundDate={data.outboundDate}
            lastMovementAt={data.lastMovementAt}
            registeredAt={data.registeredAt}
            audit={audit}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* --------------------------------------------------
       * Tabs — zones / movements / activity log
       * -------------------------------------------------- */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
      >
        <Tab label={`Zones (${zones.length})`} value="zones" />
        <Tab label={`Movements (${movements.length})`} value="movements" />
        <Tab label="Activity Log" value="activity" />
      </Tabs>
      
      {activeTab === 'zones' && <WarehouseInventoryZonesTable rows={zones} />}
      {activeTab === 'movements' && (
        <WarehouseInventoryMovementsTable rows={movements} />
      )}
      {activeTab === 'activity' && warehouseId && inventoryId && (
        <WarehouseInventoryActivityLogPanel
          warehouseId={warehouseId}
          warehouseInventoryId={inventoryId}
        />
      )}
    </Box>
  );
};

export default WarehouseInventoryDetailPage;
