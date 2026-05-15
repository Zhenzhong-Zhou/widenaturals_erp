import { type FC, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Tooltip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { CustomTypography } from '@components/index';
import { useHasPermission } from '@features/authorize/hooks';
import { useWarehouseLookup } from '@hooks/index';
import { useRecentWarehouses } from '@features/warehouse/hooks';
import ROUTE_PERMISSIONS from '@utils/constants/routePermissionConstants';
import { formatLabel } from '@utils/textUtils';

interface WarehouseEntry {
  id: string;
  name: string;
  code: string;
  locationName: string;
  warehouseType: string | null;
  isRecent: boolean;
}

/**
 * Dashboard section listing every warehouse the user can access.
 *
 * Recent warehouses are pinned to the top in most-recent-first order,
 * followed by the rest of the user's accessible warehouses sorted by
 * name. When the user has no recent visits yet, the section behaves as
 * a flat list of accessible warehouses.
 *
 * Self-hides when the user lacks warehouse view permission or has no
 * accessible warehouses.
 */
const MyWarehouses: FC = () => {
  const hasPermission = useHasPermission();
  const canView = hasPermission(ROUTE_PERMISSIONS.WAREHOUSES.VIEW) === true;

  const {
    items: warehouses,
    loading,
    error,
    fetchLookup,
    resetLookup,
  } = useWarehouseLookup();

  const { recent, clearRecent } = useRecentWarehouses();

  useEffect(() => {
    if (canView) {
      fetchLookup();
    }
  }, [canView, fetchLookup]);

  useEffect(
    () => () => {
      resetLookup();
    },
    [resetLookup]
  );

  const ordered = useMemo<WarehouseEntry[]>(() => {
    if (!warehouses) return [];

    const accessibleIds = new Set(warehouses.map((w) => w.value));
    const recentIds = new Set(recent.map((r) => r.id));

    const recentEntries: WarehouseEntry[] = recent
      .filter((r) => accessibleIds.has(r.id))
      .map((r) => {
        const w = warehouses.find((x) => x.value === r.id)!;
        return {
          id: w.value,
          name: w.metadata.name,
          code: w.metadata.code,
          locationName: w.metadata.locationName,
          warehouseType: w.metadata.warehouseType ?? null,
          isRecent: true,
        };
      });

    const otherEntries: WarehouseEntry[] = warehouses
      .filter((w) => !recentIds.has(w.value))
      .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name))
      .map((w) => ({
        id: w.value,
        name: w.metadata.name,
        code: w.metadata.code,
        locationName: w.metadata.locationName,
        warehouseType: w.metadata.warehouseType ?? null,
        isRecent: false,
      }));

    return [...recentEntries, ...otherEntries];
  }, [warehouses, recent]);

  if (!canView) return null;
  if (error) return null;
  
  if (loading) {
    return (
      <Box>
        <CustomTypography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            mb: 2,
          }}
        >
          My Warehouses
        </CustomTypography>
        
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton
                variant="rectangular"
                height={72}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  if (ordered.length === 0) return null;
  
  const hasRecent = recent.length > 0;
  
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <CustomTypography variant="subtitle1" sx={{ fontWeight: 700 }}>
          My Warehouses
        </CustomTypography>
        
        {hasRecent && (
          <Tooltip title="Clear recently visited">
            <IconButton size="small" onClick={clearRecent}>
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Grid container spacing={2}>
        {ordered.map((w) => (
          <Grid key={w.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                borderRadius: 2,
                ...(w.isRecent && { borderColor: 'primary.main' }),
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={`/warehouse-inventory/${w.id}/inventory`}
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                    minHeight: 64,
                  }}
                >
                  <Box
                    sx={{
                      color: w.isRecent ? 'primary.main' : 'text.secondary',
                      flexShrink: 0,
                    }}
                  >
                    <WarehouseIcon fontSize="large" />
                  </Box>
                  
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Top row: name + recent indicator */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mb: 0.25,
                      }}
                    >
                      <CustomTypography
                        variant="subtitle2"
                        noWrap
                        sx={{
                          fontWeight: 700,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {w.name}
                      </CustomTypography>
                      
                      {w.isRecent && (
                        <Tooltip title="Recently visited">
                          <HistoryIcon
                            fontSize="inherit"
                            sx={{ color: 'primary.main', flexShrink: 0 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    
                    {/* Bottom row: code + location + type chip */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minHeight: 20,
                      }}
                    >
                      <CustomTypography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        sx={{
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {w.code} · {w.locationName}
                      </CustomTypography>
                      
                      {w.warehouseType && (
                        <Chip
                          label={formatLabel(w.warehouseType)}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 20,
                            flexShrink: 0,
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MyWarehouses;
