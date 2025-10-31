import { type FC, useCallback, useMemo, useState } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import type { FlattenedBomSupplyRow } from '@features/bom/state';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import {
  BatchInfoSection,
  BomItemMetadataSection,
  getBomSupplyMiniTableColumns,
  PackagingMaterialSection,
  SupplierInfoSection,
} from '@features/bom/components/BomOverview';
import CustomTypography from '@components/common/CustomTypography';
import SidePanelDrawer from '@components/common/SidePanelDrawer';
import DetailsSection from '@components/common/DetailsSection';

interface BomItemSupplyMiniTableProps {
  /**
   * Flattened supply data for a single BOM item.
   * Each record represents a supplier–batch combination.
   */
  data: FlattenedBomSupplyRow[];
  
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
  const [selectedRow, setSelectedRow] = useState<FlattenedBomSupplyRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const handleOpenDetails = useCallback((row: FlattenedBomSupplyRow) => {
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
      {/* === Main mini table of supplier/batch list === */}
      <CustomMiniTable
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        dense
      />
      
      {/* === Drawer for detailed batch info === */}
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
              <DetailsSection
                sectionTitle="Part Metadata"
                fields={[{ label: 'Part Name', value: selectedRow.partName }]}
              />
              
              {/* === Section: Packaging Material === */}
              <PackagingMaterialSection row={selectedRow} />
              
              {/* === Visual divider between major domains === */}
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: BOM Item Metadata === */}
              <BomItemMetadataSection row={selectedRow} />
              
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: Supplier Contract Info === */}
              <SupplierInfoSection row={selectedRow} />
              
              <Divider sx={{ my: 3 }} />
              
              {/* === Section: Batch Information === */}
              <BatchInfoSection row={selectedRow} />
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
