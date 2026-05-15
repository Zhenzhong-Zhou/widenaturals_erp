import {
  type FC,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  Grid,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  GoBackButton,
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
import {
  AdjustQuantitiesModal,
  RecordOutboundModal,
  UpdateMetadataModal,
  UpdateStatusModal,
} from '@features/warehouseInventory/components/operations';
import { useWarehouseInventoryDetail } from '@hooks/index';
import { formatInventoryStatus } from '@utils/formatters';
import { formatLabel } from '@utils/textUtils';
import { useWarehouseInventoryPermissions } from '@features/warehouseInventory/hooks';

type DetailModal = 'idle' | 'adjust' | 'updateStatus' | 'metadata' | 'outbound';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);
  const openMenu = (e: SyntheticEvent<HTMLElement>) =>
    setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  // Single discriminant for which modal is open
  const [activeModal, setActiveModal] = useState<DetailModal>('idle');
  const openModal = useCallback((m: Exclude<DetailModal, 'idle'>) => {
    closeMenu();
    setActiveModal(m);
  }, []);
  const closeModal = useCallback(() => setActiveModal('idle'), []);

  // Snackbar
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

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

  const {
    canAdjustInventory,
    canAdjustReserved,
    canUpdateInventoryStatus,
    canEditInventoryMetadata,
    canRecordOutbound,
  } = useWarehouseInventoryPermissions();

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

  const handleSuccess = useCallback(
    (message?: string) => {
      setSnackbar({
        open: true,
        message: message ?? 'Operation completed successfully.',
        severity: 'success',
      });
      handleRefresh();
    },
    [handleRefresh]
  );

  // -----------------------------
  // Derived header title (lot# for product, displayName for packaging)
  // -----------------------------
  const headerTitle =
    data?.batchType === 'product'
      ? (productInfo?.batch.lotNumber ?? '—')
      : (packagingInfo?.batch.displayName ??
        packagingInfo?.batch.lotNumber ??
        '—');

  const batchTypeLabel =
    data?.batchType === 'product' ? 'Product' : 'Packaging Material';

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {loading ? (
        <Loading variant="dotted" message="Loading inventory record..." />
      ) : error ? (
        <ErrorMessage message={error} showNavigation />
      ) : !data ? (
        <NoDataFound message="Warehouse inventory record not found." />
      ) : (
        <>
          {/* --------------------------------------------------
           * Header — badges + title + refresh
           * -------------------------------------------------- */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                mb: 1.5,
              }}
            >
              <Chip
                label={batchTypeLabel}
                size="small"
                color={data.batchType === 'product' ? 'primary' : 'secondary'}
              />
              {formatInventoryStatus(
                data.status.name,
                formatLabel(data.status.name)
              )}
            </Stack>
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CustomTypography variant="h5" sx={{ fontWeight: 600 }}>
                {headerTitle}
              </CustomTypography>
              
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'center',
                }}
              >
                <GoBackButton
                  variant="outlined"
                  sx={{
                    width: 128,
                    height: 44,
                    px: 2.5,
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                />
                <CustomButton
                  variant="outlined"
                  onClick={handleRefresh}
                  sx={{
                    width: 128,
                    height: 44,
                    px: 2.5,
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  Refresh
                </CustomButton>
                <CustomButton
                  variant="contained"
                  onClick={openMenu}
                  sx={{
                    width: 128,
                    height: 44,
                    px: 2.5,
                    borderRadius: 999,
                    flexShrink: 0,
                  }}
                >
                  Actions ▾
                </CustomButton>
              </Stack>

              {/* ── Actions menu ─────────────────────────────────────────────────── */}
              <Menu
                anchorEl={menuAnchor}
                open={menuOpen}
                onClose={closeMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {canAdjustInventory && (
                  <MenuItem onClick={() => openModal('adjust')}>
                    <ListItemText>Adjust Quantity</ListItemText>
                  </MenuItem>
                )}
                {canUpdateInventoryStatus && (
                  <MenuItem onClick={() => openModal('updateStatus')}>
                    <ListItemText>Update Status</ListItemText>
                  </MenuItem>
                )}
                {canRecordOutbound && (
                  <MenuItem onClick={() => openModal('outbound')}>
                    <ListItemText>Record Outbound</ListItemText>
                  </MenuItem>
                )}
                {canEditInventoryMetadata && (
                  <MenuItem onClick={() => openModal('metadata')}>
                    <ListItemText>Edit Metadata</ListItemText>
                  </MenuItem>
                )}
              </Menu>
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
                <CustomTypography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 1.5,
                  }}
                >
                  Warehouse Details
                </CustomTypography>
                
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <CustomTypography color="text.secondary">
                      Warehouse fee
                    </CustomTypography>
                    <CustomTypography>{data.warehouseFee}</CustomTypography>
                  </Box>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
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
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label={`Zones (${zones.length})`} value="zones" />
            <Tab label={`Movements (${movements.length})`} value="movements" />
            <Tab label="Activity Log" value="activity" />
          </Tabs>
          
          {activeTab === 'zones' && (
            <WarehouseInventoryZonesTable rows={zones} />
          )}
          
          {activeTab === 'movements' && (
            <WarehouseInventoryMovementsTable rows={movements} />
          )}
          
          {activeTab === 'activity' && warehouseId && inventoryId && (
            <WarehouseInventoryActivityLogPanel
              warehouseId={warehouseId}
              warehouseInventoryId={inventoryId}
            />
          )}

          {/* ── Modals ───────────────────────────────────────────────────────── */}
          {canAdjustInventory && warehouseId && data && (
            <AdjustQuantitiesModal
              open={activeModal === 'adjust'}
              onClose={closeModal}
              warehouseId={warehouseId}
              record={data}
              canAdjustReserved={canAdjustReserved}
              onSuccess={handleSuccess}
            />
          )}
          
          {canUpdateInventoryStatus && warehouseId && data && (
            <UpdateStatusModal
              open={activeModal === 'updateStatus'}
              onClose={closeModal}
              warehouseId={warehouseId}
              record={data}
              onSuccess={handleSuccess}
            />
          )}
          
          {canEditInventoryMetadata && warehouseId && (
            <UpdateMetadataModal
              open={activeModal === 'metadata'}
              onClose={closeModal}
              warehouseId={warehouseId}
              record={data}
              onSuccess={handleSuccess}
            />
          )}
          
          {canRecordOutbound && warehouseId && (
            <RecordOutboundModal
              open={activeModal === 'outbound'}
              onClose={closeModal}
              warehouseId={warehouseId}
              record={data}
              onSuccess={handleSuccess}
            />
          )}
          
          <Snackbar
            open={snackbar?.open ?? false}
            autoHideDuration={4000}
            onClose={() => setSnackbar(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert severity={snackbar?.severity ?? 'info'} variant="filled">
              {snackbar?.message}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default WarehouseInventoryDetailPage;
