import { type FC, useMemo } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import { formatCurrency } from '@utils/textUtils';
import type { BomSupplierSummary } from '@features/bom/state';

/**
 * Mini-table displaying supplier-level cost breakdown for a BOM.
 *
 * @example
 * <BomSupplierBreakdownMiniTable data={summary.suppliers} />
 */
interface BomSupplierBreakdownMiniTableProps {
  /** List of supplier cost summaries */
  data: BomSupplierSummary[];
}

const BomSupplierBreakdownMiniTable: FC<BomSupplierBreakdownMiniTableProps> = ({
  data,
}) => {
  const columns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Supplier',
        renderCell: (row: BomSupplierSummary) => row.name || '—',
      },
      {
        id: 'supplierTotalActualCost',
        label: 'Total (Base)',
        renderCell: (row: BomSupplierSummary) =>
          formatCurrency(row.supplierTotalActualCost, 'CAD'),
      },
    ],
    []
  );

  return (
    <CustomMiniTable
      columns={columns}
      data={data}
      dense
      emptyMessage="No supplier cost data available"
    />
  );
};

export default BomSupplierBreakdownMiniTable;
