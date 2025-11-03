import { type FC, useCallback, useMemo, useState } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import type { UnifiedBatchRow } from '@features/bom/state';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import {
  BatchInfoSection,
  BatchInventorySection,
  BomItemMetadataSection,
  getBomSupplyMiniTableColumns,
  PackagingMaterialSection,
  PartMetadataSection,
  SupplierInfoSection,
} from '@features/bom/components/BomOverview';
import CustomTypography from '@components/common/CustomTypography';
import SidePanelDrawer from '@components/common/SidePanelDrawer';

/**
 * Mini table displaying batch-level data for a single BOM item.
 * Supports unified display of supplier and readiness (inventory) info.
 */
interface BomItemSupplyMiniTableProps {
  /**
   * Flattened unified batch data for this BOM item.
   * Each record can originate from supplier, readiness, or merged source.
   */
  data: UnifiedBatchRow[];
  
  /**
   * Whether to show dynamic quantity columns (Available, Allocated, Required)
   * merged from the production summary API.
   * Defaults to `false`.
   */
  showQuantities?: boolean;
  
  /**
   * Optional custom empty message when there’s no data.
   */
  emptyMessage?: string;
}

/**
 * Renders a mini table of supplier and batch-level supply info for a BOM item.
 *
 * Used inside the BOM Details page as an expandable section under each part.
 * Displays supplier, contract, batch, and cost details, optionally merged
 * with real-time quantity info from the production summary API.
 *
 * @example
 * <BomItemSupplyMiniTable data={flattenedSupplyRows} showQuantities />
 */
const BomItemSupplyMiniTable: FC<BomItemSupplyMiniTableProps> = ({
                                                                   data,
                                                                   emptyMessage = 'No supply records found',
                                                                 }) => {
  const [selectedRow, setSelectedRow] = useState<UnifiedBatchRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleOpenDetails = useCallback((row: UnifiedBatchRow) => {
    setSelectedRow(row);
    setDrawerOpen(true);
  }, []);
  
  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);
  
  const columns = useMemo(() =>
    getBomSupplyMiniTableColumns(handleOpenDetails), [handleOpenDetails]);
  
  return (
    <>
      {/* === Mini Table === */}
      <CustomMiniTable<UnifiedBatchRow>
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        dense
      />
      
      {/* === Side Panel === */}
      <SidePanelDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title="Batch Details"
        width={640}          // Consistent with other feature drawers
        anchor="right"       // Default alignment is right
      >
        {selectedRow ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Scroll container inside drawer (so header stays sticky) */}
            <Box sx={{ overflowY: 'auto', pr: 1, pb: 3 }}>
              
              {/* === Section: Part Metadata === */}
              {selectedRow?.sourceSupply && (
                <PartMetadataSection row={selectedRow.sourceSupply} />
              )}
              
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: Packaging Material === */}
              {selectedRow?.sourceSupply && (
                <PackagingMaterialSection row={selectedRow.sourceSupply} />
              )}
              
              {/* === Visual divider between major domains === */}
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: BOM Item Metadata === */}
              {selectedRow?.sourceSupply && (
                <BomItemMetadataSection row={selectedRow.sourceSupply} />
              )}
              
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: Supplier Contract Info === */}
              {selectedRow?.sourceSupply && (
                <SupplierInfoSection row={selectedRow.sourceSupply} />
              )}
              
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: Batch Information === */}
              {selectedRow?.sourceSupply && (
                <BatchInfoSection row={selectedRow.sourceSupply} />
              )}
              
              <Divider sx={{ my: 3 }} />
              
              {/* --- Section: Inventory (Readiness) Information --- */}
              {selectedRow?.sourceReadiness && (
                <BatchInventorySection row={selectedRow.sourceReadiness} />
              )}
            </Box>
          </Box>
        ) : (
          <CustomTypography variant="body2">No record selected</CustomTypography>
        )}
      </SidePanelDrawer>
    </>
  );
};

export default BomItemSupplyMiniTable;
