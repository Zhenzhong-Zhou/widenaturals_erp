import { FC } from 'react';
import Paper from '@mui/material/Paper';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection, {
  DetailsSectionField,
} from '@components/common/DetailsSection';
import { FlattenedProductDetail } from '@features/product/state';
import { formatLabel } from '@utils/textUtils';

const buildProductInfoFields = (
  p: FlattenedProductDetail
): DetailsSectionField[] => [
  {
    label: 'Name',
    value: p.name,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Brand',
    value: p.brand,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Series',
    value: p.series,
    format: (v) => (v ? formatLabel(v) : '—'),
  },
  {
    label: 'Category',
    value: p.category,
  },
  {
    label: 'Description',
    value: p.description,
    format: (v) => v || '—',
  },
];

interface Props {
  product: FlattenedProductDetail;
}

const ProductDetailInformationSection: FC<Props> = ({ product }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      <CustomTypography variant="h6" fontWeight={600} gutterBottom>
        Product Information
      </CustomTypography>

      <DetailsSection fields={buildProductInfoFields(product)} />
    </Paper>
  );
};

export default ProductDetailInformationSection;
