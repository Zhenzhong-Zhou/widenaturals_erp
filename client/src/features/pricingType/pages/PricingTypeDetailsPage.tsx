import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  Loading,
  NoDataFound,
} from '@components/index';
import type {
  PricingGroupFilters,
  PricingGroupSortField,
} from '@features/pricingGroup';
import {
  PricingGroupFiltersPanel,
  PricingGroupListTable,
  PricingGroupSortControls,
} from '@features/pricingGroup/components';
import { usePricingGroupLookups } from '@features/pricingGroup/hook';
import { PricingTypeDetailPanel } from '@features/pricingType/components/PricingTypeDetail';
import { createLazyOpenHandler } from '@features/lookup/utils/lookupUtils';
import {
  usePaginatedPricingGroups,
  usePricingTypeDetail,
} from '@hooks/index';
import { applyFiltersAndSorting } from '@utils/query';
import { usePaginationHandlers } from '@utils/hooks';

/**
 * Full detail page for a single pricing type.
 *
 * Displays identity, status, and audit information for the pricing type,
 * followed by the pricing group list which is managed within this context.
 *
 * Route param: pricingTypeId (UUID)
 */
const PricingTypeDetailsPage: FC = () => {
  const { pricingTypeId } = useParams<{ pricingTypeId: string }>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] =
    useState<PricingGroupSortField>('defaultNaturalSort');
  const [sortOrder, setSortOrder] = useState<'' | 'ASC' | 'DESC'>('');
  const [filters, setFilters] = useState<PricingGroupFilters>({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const {
    pricingType,
    loading,
    error,
    fetchPricingTypeDetail,
    resetPricingTypeDetailState,
  } = usePricingTypeDetail();

  const {
    data: pricingGroupData,
    pagination: pricingGroupPagination,
    loading: pricingGroupLoading,
    error: pricingGroupError,
    isEmpty: isPricingGroupEmpty,
    fetchPricingGroups,
    resetPricingGroups,
  } = usePaginatedPricingGroups();
  
  const lookups = usePricingGroupLookups();
  
  // -----------------------------
  // Fetch on mount
  // -----------------------------
  useEffect(() => {
    if (pricingTypeId) {
      fetchPricingTypeDetail(pricingTypeId);
    }
    
    return () => {
      resetPricingTypeDetailState();
    };
  }, [pricingTypeId]);
  
  // -----------------------------
  // Query model (shared)
  // -----------------------------
  const fullQuery = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        ...filters,
        pricingTypeId,
      },
    }),
    [page, limit, sortBy, sortOrder, filters, pricingTypeId]
  );

  // -----------------------------
  // Refresh action
  // -----------------------------
  const refreshPricingGroupList = useCallback(() => {
    fetchPricingGroups(fullQuery);
  }, [fullQuery, fetchPricingGroups]);

  // -----------------------------
  // Params for filtering/sorting engine
  // -----------------------------
  const queryParams = useMemo(
    () => ({
      ...fullQuery,
      fetchFn: refreshPricingGroupList,
    }),
    [fullQuery, refreshPricingGroupList]
  );

  // -----------------------------
  // Debounced fetch
  // -----------------------------
  useEffect(() => {
    const timeout = setTimeout(() => applyFiltersAndSorting(queryParams), 200);
    return () => clearTimeout(timeout);
  }, [queryParams]);

  // ----------------------------------------
  // Cleanup on unmount
  // ----------------------------------------
  useEffect(() => {
    return () => {
      resetPricingGroups();
    };
  }, [resetPricingGroups]);

  // -----------------------------
  // Lookup handlers (lazy fetch, reset)
  // -----------------------------
  const lookupHandlers = useMemo(
    () => ({
      resetAll: () => {
        lookups.status.reset();
      },
      
      onOpen: {
        status: createLazyOpenHandler(
          lookups.status.options,
          lookups.status.fetch
        ),
      },
    }),
    [lookups]
  );

  // -----------------------------
  // Event handlers
  // -----------------------------
  const handleRefresh = useCallback(() => {
    applyFiltersAndSorting(queryParams);
  }, [queryParams]);
  
  const handleResetFilters = () => {
    resetPricingGroups();
    setFilters({});
    setSortBy('defaultNaturalSort');
    setSortOrder('');
    lookupHandlers.resetAll();
    setPage(1);
  };
  
  const { handlePageChange, handleRowsPerPageChange } = usePaginationHandlers(
    setPage,
    setLimit
  );
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };
  
  // -----------------------------
  // Loading / error states
  // -----------------------------
  if (loading) {
    return <Loading variant="dotted" message="Loading pricing type..." />;
  }
  
  if (error) {
    return <ErrorMessage message={error} showNavigation />;
  }
  
  if (!pricingType) {
    return <NoDataFound message="Pricing type not found." />;
  }
  
  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box sx={{ px: 4, py: 3 }}>
      
      {/* --------------------------------------------------
       * Page Header
       * -------------------------------------------------- */}
      <PricingTypeDetailPanel
        pricingType={pricingType}
        onEdit={() => {/* TODO */}}
      />
      
      <Divider sx={{ my: 3 }} />
      
      {/* --------------------------------------------------
       * Pricing Groups Section
       * -------------------------------------------------- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          Pricing Groups
        </CustomTypography>
        
        <CustomButton variant="contained">
          + New Price Group
        </CustomButton>
      </Box>
      
      {/* Filter + Sort Controls */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2, minHeight: 200 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 9 }}>
            <PricingGroupFiltersPanel
              filters={filters}
              lookups={lookups}
              lookupHandlers={lookupHandlers}
              onChange={setFilters}
              onApply={() => setPage(1)}
              onReset={handleResetFilters}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <PricingGroupSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
              showPricingType={false}
            />
          </Grid>
        </Grid>
      </Card>
      
      {/* Pricing Group Table Section */}
      {pricingGroupLoading || !pricingGroupPagination ? (
        <Loading variant="dotted" message="Loading pricing groups..." />
      ) : pricingGroupError ? (
        <ErrorMessage message={pricingGroupError} showNavigation />
      ) : isPricingGroupEmpty ? (
        <NoDataFound
          message="No pricing groups found for this pricing type."
          action={
            <CustomButton onClick={handleResetFilters}>Reset</CustomButton>
          }
        />
      ) : (
        <PricingGroupListTable
          data={pricingGroupData}
          loading={pricingGroupLoading}
          page={page - 1}
          rowsPerPage={limit}
          totalRecords={pricingGroupPagination.totalRecords}
          totalPages={pricingGroupPagination.totalPages}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          expandedRowId={expandedRowId}
          onDrillDownToggle={handleDrillDownToggle}
          onRefresh={handleRefresh}
        />
      )}
    </Box>
  );
};

export default PricingTypeDetailsPage;
