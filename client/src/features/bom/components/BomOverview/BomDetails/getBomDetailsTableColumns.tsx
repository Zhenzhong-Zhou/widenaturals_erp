/**
 * @fileoverview
 * Defines column configurations for the **BOM Details Table**.
 *
 * Displays part-level information for a selected Bill of Materials (BOM),
 * including part identification, quantity, unit, costing, and notes.
 *
 * Consumed by `<CustomTable>` within:
 *  - `BomOverviewPage`
 *  - `BomDetailsSection`
 *
 * Each column definition includes:
 *  - `id`: unique key used for column mapping
 *  - `label`: header display text
 *  - `renderCell`: custom renderer for consistent formatting and fallbacks
 */

import type { Column } from '@components/common/CustomTable';
import { getFallbackValue } from '@utils/objectUtils';
import { formatCurrency, formatLabel } from '@utils/textUtils';
import type { FlattenedBomDetailRow } from '@features/bom/state';
import { createDrillDownColumn } from '@utils/table/createDrillDownColumn';

/**
 * Builds the column configuration for the **BOM Details Table**.
 *
 * Displays key part-level data, such as:
 *  - Part code and name
 *  - Type and quantity per product
 *  - Estimated cost and currency
 *  - Optional notes
 *
 * @returns {Column<FlattenedBomDetailRow>[]} Configured table columns
 *
 * @example
 * <CustomTable
 *   columns={getBomDetailsTableColumns()}
 *   data={flattenedData}
 * />
 */
export const getBomDetailsTableColumns = (
  expandedRowId?: string | null,
  handleDrillDownToggle?: (id: string) => void
): Column<FlattenedBomDetailRow>[] => {
  return [
    {
      id: 'partName',
      label: 'Part Name',
      renderCell: (row) => getFallbackValue(row.partName),
    },
    {
      id: 'partCode',
      label: 'Part Code',
      renderCell: (row) => getFallbackValue(row.partCode),
    },
    {
      id: 'partType',
      label: 'Type',
      renderCell: (row) => formatLabel(row.partType ?? '—'),
    },
    {
      id: 'partQtyPerProduct',
      label: 'Qty / Product',
      renderCell: (row) => row.partQtyPerProduct ?? '—',
    },
    {
      id: 'unit',
      label: 'BOM Unit',
      renderCell: (row) => getFallbackValue(row.unit),
    },
    {
      id: 'partUnitOfMeasure',
      label: 'Part UOM',
      renderCell: (row) => getFallbackValue(row.partUnitOfMeasure),
    },
    {
      id: 'estimatedUnitCost',
      label: 'Est. Unit Cost',
      renderCell: (row) =>
        formatCurrency(row.estimatedUnitCost, row.currency ?? '$', 'en-US', 4),
    },
    {
      id: 'currency',
      label: 'Currency',
      renderCell: (row) => row.currency ?? '—',
    },
    {
      id: 'exchangeRate',
      label: 'Exch. Rate',
      renderCell: (row) =>
        row.exchangeRate !== null && row.exchangeRate !== undefined
          ? row.exchangeRate.toFixed(2)
          : '—',
    },
    {
      id: 'estimatedCostCAD',
      label: 'Est. Cost (CAD)',
      renderCell: (row) =>
        formatCurrency(row.estimatedCostCAD, 'CAD', 'en-US', 6),
    },
    ...(handleDrillDownToggle
      ? [
          createDrillDownColumn<FlattenedBomDetailRow>(
            (row) => handleDrillDownToggle(row.bomItemId),
            (row) => expandedRowId === row.bomItemId
          ),
        ]
      : []),
  ];
};
