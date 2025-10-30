import { type FC, useCallback, useMemo, useState } from 'react';
import type {
  BomItemWithSupply,
  FlattenedBomDetailRow
} from '@features/bom/state/bomTypes';
import Box from '@mui/material/Box';
import CustomTable from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import {
  BomPartExpandedSection,
  getBomDetailsTableColumns,
  BomItemSupplyMiniTable
} from '@features/bom/components/BomOverview';

/**
 * Props for the BOM Details Table component.
 */
interface BomDetailsTableProps {
  mergedData: BomItemWithSupply[];
  /** Indicates if the data is currently loading. */
  loading?: boolean;
  /** Total number of BOM items (used for single-page pagination). */
  itemCount: number;
  
  // todo: loading?
}

/**
 * Displays the detailed list of BOM items (parts) within a single BOM.
 *
 * Includes:
 *  - Table of parts and cost breakdown
 *  - Expandable row for additional audit / metadata
 *
 * @example
 * <BomDetailsTable
 *   data={flattenedData}
 *   loading={loading}
 *   itemCount={flattenedData.length}
 * />
 */
const BomDetailsTable: FC<BomDetailsTableProps> = ({
                                                     mergedData,
                                                     loading,
                                                     itemCount,
                                                   }) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  
  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };
  
  const columns = useMemo(
    () => getBomDetailsTableColumns(expandedRowId, handleDrillDownToggle),
    [expandedRowId]
  );
  
  const renderExpandedContent = useCallback(
    (row: FlattenedBomDetailRow) => {
      const matched = mergedData.find(
        (item) => item.details.bomItemId === row.bomItemId
      );
      
      const supplyData = matched?.supplyDetails ?? [];
      const hasSupply = supplyData.length > 0;
      
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            p: 2,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* --- Part metadata section --- */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              boxShadow: (theme) => theme.shadows[1],
            }}
          >
            <BomPartExpandedSection row={row} />
          </Box>
          
          {/* --- Supply info section --- */}
          <Box
            sx={{
              borderRadius: 1,
              bgcolor: hasSupply ? 'background.paper' : 'transparent',
              boxShadow: hasSupply ? (theme) => theme.shadows[1] : 'none',
              p: hasSupply ? 1.5 : 0,
            }}
          >
            <Box
              sx={{
                mb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <CustomTypography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                Supplier Batch Info
              </CustomTypography>
            </Box>
            
            {hasSupply ? (
              <BomItemSupplyMiniTable
                data={supplyData}
                emptyMessage="No supplier batches found"
              />
            ) : (
              <CustomTypography
                variant="body2"
                sx={{ color: 'text.secondary', fontStyle: 'italic', p: 1 }}
              >
                No supplier batches found.
              </CustomTypography>
            )}
          </Box>
        </Box>
      );
    },
    [mergedData]
  );
  
  return (
    <Box>
      {/* --- Header --- */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <CustomTypography variant="h6" fontWeight={600}>
          BOM Details
        </CustomTypography>
      </Box>
      
      {/* --- Table --- */}
      <CustomTable
        columns={columns}
        data={mergedData.map((row) => row.details)}
        loading={loading}
        page={0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        initialRowsPerPage={itemCount}
        rowsPerPageOptions={[itemCount]}
        getRowId={(row) => row.bomItemId ?? 'no-item'}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={renderExpandedContent}
        emptyMessage="No BOM item details found."
      />
    </Box>
  );
};

export default BomDetailsTable;
