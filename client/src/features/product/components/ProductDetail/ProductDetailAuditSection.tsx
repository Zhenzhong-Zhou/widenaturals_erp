import { FC } from 'react';
import Paper from '@mui/material/Paper';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection, {
  DetailsSectionField,
} from '@components/common/DetailsSection';
import { FlattenedProductDetail } from '@features/product/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils.ts';

const buildAuditFields = (p: FlattenedProductDetail): DetailsSectionField[] => [
  {
    label: 'Created At',
    value: p.createdAt,
    format: (v) => (v ? formatDateTime(v) : '—'),
  },
  {
    label: 'Created By',
    value: p.createdByName,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Updated At',
    value: p.updatedAt,
    format: (v) => (v ? formatDateTime(v) : 'Never updated'),
  },
  {
    label: 'Updated By',
    value: p.updatedByName,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
];

interface Props {
  product: FlattenedProductDetail;
}

const ProductDetailAuditSection: FC<Props> = ({ product }) => {
  return (
    <Paper sx={{ p: 3 }} elevation={1}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Audit Information
      </CustomTypography>

      <DetailsSection fields={buildAuditFields(product)} />
    </Paper>
  );
};

export default ProductDetailAuditSection;
