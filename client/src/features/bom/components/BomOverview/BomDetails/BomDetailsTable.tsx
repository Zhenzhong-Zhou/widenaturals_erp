import { type FC, useMemo, useState } from 'react';
import type { FlattenedBomDetailRow } from '@features/bom/state/bomTypes';
import Box from '@mui/material/Box';
import CustomTable from '@components/common/CustomTable';
import CustomTypography from '@components/common/CustomTypography';
import { BomPartExpandedSection, getBomDetailsTableColumns } from '@features/bom/components/BomOverview';

/**
 * Props for the BOM Details Table component.
 */
interface BomDetailsTableProps {
  /** Flattened part-level data for the BOM. */
  data: FlattenedBomDetailRow[];
  /** Indicates if the data is currently loading. */
  loading?: boolean;
  /** Total number of BOM items (used for single-page pagination). */
  itemCount: number;
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
                                                     data,
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
        data={data}
        loading={loading}
        page={0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
        initialRowsPerPage={itemCount}
        rowsPerPageOptions={[itemCount]}
        getRowId={(row) => row.bomItemId ?? 'no-item'}
        expandable
        expandedRowId={expandedRowId}
        expandedContent={(row) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {/* Expanded details section */}
            <BomPartExpandedSection row={row} />
          </Box>
        )}
        emptyMessage="No BOM item details found."
      />
    </Box>
  );
};

export default BomDetailsTable;
