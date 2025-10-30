import { type FC, useMemo } from 'react';
import CustomMiniTable from '@components/common/CustomMiniTable';
import { formatCurrency } from '@utils/textUtils';
import type { BomPartSummary } from '@features/bom/state';

/**
 * Mini-table displaying part-level cost breakdown for a BOM.
 *
 * @example
 * <BomPartBreakdownMiniTable data={summary.parts} />
 */
interface BomPartBreakdownMiniTableProps {
  /** List of part cost summaries */
  data: BomPartSummary[];
}

const BomPartBreakdownMiniTable: FC<BomPartBreakdownMiniTableProps> = ({ data }) => {
  const columns = useMemo(
    () => [
      {
        id: 'partName',
        label: 'Part Name',
        renderCell: (row: BomPartSummary) => row.partName || '—',
      },
      {
        id: 'materialName',
        label: 'Packaging Material Name',
        renderCell: (row: BomPartSummary) => row.materialName || row.displayName || '—',
      },
      {
        id: 'partTotalContractCost',
        label: 'Total (Base)',
        renderCell: (row: BomPartSummary) =>
          formatCurrency(row.partTotalContractCost, 'CAD'),
      },
    ],
    []
  );
  
  return (
    <CustomMiniTable
      columns={columns}
      data={data}
      dense
      emptyMessage="No part cost data available"
    />
  );
};

export default BomPartBreakdownMiniTable;
