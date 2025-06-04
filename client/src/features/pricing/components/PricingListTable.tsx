import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';
import CustomTable, { type Column } from '@components/common/CustomTable';
import { useThemeContext } from '@context/ThemeContext.tsx';

interface PricingRow {
  pricingId: string;
  price: number;
  pricingTypeId: string;
  pricingTypeName: string;
  pricingTypeCode: string;
  pricingTypeSlug: string;
  productName: string;
  productBrand: string;
  skuValue: string;
  sizeLabel: string;
  barcode: string;
  validFrom: string;
  validTo: string | null;
}

interface PricingTableProps {
  data: PricingRow[];
  page: number;
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

const PricingListTable: FC<PricingTableProps> = ({
                                               data,
                                               page,
                                               rowsPerPage,
                                               totalRecords,
                                               totalPages,
                                               onPageChange,
                                               onRowsPerPageChange,
                                             }) => {
  const { theme } = useThemeContext();
  const columns: Column<PricingRow>[] = [
    {
      id: 'sku',
      label: 'SKU',
      sortable: true,
      renderCell: (row: PricingRow) => (
        <Link
          to={`/pricings/${row.pricingTypeSlug}/${row.pricingTypeId}`}
          style={{ textDecoration: 'none',  color: theme.palette.primary.main, fontWeight: 500 }}
        >
          {row.skuValue}
        </Link>
      ),
    },
    {
      id: 'productBrand',
      label: 'Brand',
      sortable: true,
    },
    {
      id: 'productName',
      label: 'Product',
      sortable: true,
    },
    {
      id: 'barcode',
      label: 'Barcode',
      sortable: true,
    },
    {
      id: 'sizeLabel',
      label: 'Size',
      sortable: true,
    },
    {
      id: 'pricingTypeCode',
      label: 'Price Code',
      sortable: true,
    },
    {
      id: 'pricingTypeName',
      label: 'Price Type',
      sortable: true,
    },
    {
      id: 'price',
      label: 'Price',
      sortable: true,
      format: (value) => formatCurrency(value),
    },
    {
      id: 'validFrom',
      label: 'Valid From',
      sortable: true,
      format: (value) => formatDateTime(value),
    },
    {
      id: 'validTo',
      label: 'Valid To',
      sortable: true,
      format: (value) => formatDateTime(value),
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

export default PricingListTable;
