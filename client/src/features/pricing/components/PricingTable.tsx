import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { PricingRecord } from '../state';
import { formatCurrency } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { useThemeContext } from '@context/ThemeContext.tsx';

interface PricingTableProps {
  data: PricingRecord[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const PricingTable: FC<PricingTableProps> = ({
                                               data,
                                               page,
                                               rowsPerPage,
                                               totalRecords,
                                               totalPages,
                                               onPageChange,
                                               onRowsPerPageChange,
                                             }) => {
  const { theme } = useThemeContext();
  
  const columns: Column<PricingRecord>[] = [
    {
      id: 'sku',
      label: 'SKU',
      sortable: true,
      renderCell: (row: PricingRecord) => (
        <Link
          to={`/pricings/${row.sku.value}/${row.pricingType.id}`}
          style={{ textDecoration: 'none',  color: theme.palette.primary.main, fontWeight: 500 }}
        >
          {row.sku.value}
        </Link>
      ),
    },
    {
      id: 'brand',
      label: 'Brand',
      sortable: true,
      renderCell: (row: PricingRecord) => row.product.brand,
    },
    {
      id: 'productName',
      label: 'Product',
      sortable: true,
      renderCell: (row: PricingRecord) => row.product.name,
    },
    {
      id: 'barcode',
      label: 'Barcode',
      sortable: true,
      renderCell: (row: PricingRecord) => row.sku.barcode,
    },
    {
      id: 'sizeLabel',
      label: 'Size',
      sortable: true,
      renderCell: (row: PricingRecord) => row.sku.sizeLabel,
    },
    {
      id: 'pricingType',
      label: 'Price Type',
      sortable: true,
      renderCell: (row: PricingRecord) => row.pricingType.name,
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      renderCell: (row: PricingRecord) => formatCurrency(row.price),
    },
    {
      id: 'validFrom',
      label: 'Valid From',
      sortable: true,
      renderCell: (row: PricingRecord) => formatDateTime(row.validFrom),
    },
    {
      id: 'validTo',
      label: 'Valid To',
      sortable: true,
      renderCell: (row: PricingRecord) => row.validTo ? formatDateTime(row.validTo) : '—',
    },
   
    
  ];
  
  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      totalRecords={totalRecords}
      totalPages={totalPages}
      initialRowsPerPage={rowsPerPage}
      rowsPerPageOptions={[25, 50, 75, 100]}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  );
};

export default PricingTable;
