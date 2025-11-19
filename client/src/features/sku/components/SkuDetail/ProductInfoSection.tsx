import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { SkuProduct } from '@features/sku/state/skuTypes';

interface ProductInfoSectionProps {
  product: SkuProduct;
}

/**
 * Displays product-level metadata (shared across all SKUs).
 */
const ProductInfoSection: FC<ProductInfoSectionProps> = ({ product }) => {
  return (
    <Section title="Product Information">
      <DetailsGrid>
        <DetailsGridItem fullWidth>
          <MemoizedDetailsSection
            fields={[
              { label: 'Product Name', value: product.name },
              { label: 'Display Name', value: product.displayName },
              { label: 'Brand', value: product.brand },
              { label: 'Series', value: product.series },
              { label: 'Category', value: product.category },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default ProductInfoSection;
