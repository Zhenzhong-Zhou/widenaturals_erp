import { type FC, useState } from 'react';
import { CustomTable } from '@components/index';
import type { FlattenedAllocationReviewItem } from '@features/inventoryAllocation';
import {
  getAllocationReviewColumns,
  InventoryAllocationExpandableContent,
} from '@features/inventoryAllocation/components/AllocationInventoryReviewDetails';

interface AllocationReviewTableProps {
  items: FlattenedAllocationReviewItem[];
  itemCount: number;
}

const AllocationReviewTable: FC<AllocationReviewTableProps> = ({
  items,
  itemCount,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleDrillDownToggle = (rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const columns = getAllocationReviewColumns(
    expandedRowId,
    handleDrillDownToggle
  );

  return (
    <CustomTable<FlattenedAllocationReviewItem>
      columns={columns}
      data={items}
      page={0}
      totalRecords={itemCount}
      getRowId={(row) => row.allocationId}
      expandable
      expandedRowId={expandedRowId}
      expandedContent={(row) => (
        <InventoryAllocationExpandableContent row={row} />
      )}
      onPageChange={() => {}}
      onRowsPerPageChange={() => {}}
      initialRowsPerPage={itemCount}
      rowsPerPageOptions={[itemCount]}
    />
  );
};

export default AllocationReviewTable;
