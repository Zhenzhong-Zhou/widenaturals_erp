import { FC } from 'react';
import Paper from '@mui/material/Paper';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection, { DetailsSectionField } from '@components/common/DetailsSection';
import { FlattenedProductDetail } from '@features/product/state';
import { formatLabel } from '@utils/textUtils';
import { formatDateTime } from '@utils/dateTimeUtils';

const buildStatusFields = (p: FlattenedProductDetail): DetailsSectionField[] => [
  {
    label: 'Status',
    value: p.statusName,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Status Updated At',
    value: p.statusDate,
    format: (v) => (v ? formatDateTime(v) : '—'),
  },
];

interface Props {
  product: FlattenedProductDetail;
}

const ProductDetailStatusSection: FC<Props> = ({ product }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Status
      </CustomTypography>
      
      <DetailsSection fields={buildStatusFields(product)} />
    </Paper>
  );
};

export default ProductDetailStatusSection;
