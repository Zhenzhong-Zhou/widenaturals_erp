import { type FC, useMemo } from 'react';
import {
  ComplianceInfoSection,
  PricingInfoSection,
  ProductInfoSection,
  SkuInfoSection,
} from '@features/sku/components/SkuDetail';
import SectionTabs from '@components/common/SectionTabs';
import SectionBlock from '@components/common/SectionBlock';
import type {
  FlattenedSkuInfo,
  FlattenedComplianceRecord,
  FlattenedPricingRecord,
  SkuProduct,
} from '@features/sku/state';

interface SkuDetailRightPanelProps {
  product: SkuProduct;
  skuInfo?: FlattenedSkuInfo | null;
  compliance?: FlattenedComplianceRecord[] | null;
  pricing?: FlattenedPricingRecord[] | null;
}

const SkuDetailRightPanel: FC<SkuDetailRightPanelProps> = ({
  product,
  skuInfo,
  compliance,
  pricing,
}) => {
  // --- Memoize tabs to avoid re-creation each render ---
  const tabs = useMemo(
    () => [
      {
        label: 'Compliance',
        content: (
          <SectionBlock title="Compliance">
            {compliance && <ComplianceInfoSection data={compliance} />}
          </SectionBlock>
        ),
      },
      {
        label: 'Pricing',
        content: (
          <SectionBlock title="Pricing">
            {pricing && <PricingInfoSection data={pricing} />}
          </SectionBlock>
        ),
      },
    ],
    [compliance, pricing]
  );

  return (
    <>
      <ProductInfoSection product={product} />
      {skuInfo && <SkuInfoSection flattened={skuInfo} />}
      <SectionTabs tabs={tabs} />
    </>
  );
};

export default SkuDetailRightPanel;
