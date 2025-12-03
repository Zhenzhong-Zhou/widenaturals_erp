import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedSkuInfo } from '@features/sku/state';
import { formatLabel } from '@utils/textUtils';
import { formatToISODate } from '@utils/dateTimeUtils';

interface SkuInfoSectionProps {
  flattened: FlattenedSkuInfo;
}

/**
 * Displays SKU-level metadata including identifiers, status,
 * audit info, and physical dimensions in a structured layout.
 */
const SkuInfoSection: FC<SkuInfoSectionProps> = ({ flattened }) => {
  return (
    <Section title="SKU Information">
      <DetailsGrid>
        {/* --- SKU Basic Info --- */}
        <DetailsGridItem fullWidth>
          <MemoizedDetailsSection
            sectionTitle="Basic Information"
            fields={[
              { label: 'SKU Code', value: flattened.sku },
              { label: 'Barcode', value: flattened.barcode },
              { label: 'Size Label', value: flattened.sizeLabel },
              { label: 'Language', value: flattened.language },
              { label: 'Country Code', value: flattened.countryCode },
              { label: 'Market Region', value: flattened.marketRegion },
              { label: 'Description', value: flattened.description },
            ]}
          />
        </DetailsGridItem>
        
        {/* --- Dimensions --- */}
        <DetailsGridItem fullWidth>
          <MemoizedDetailsSection
            sectionTitle="Dimensions"
            fields={[
              { label: 'Length (cm)', value: flattened.lengthCm },
              { label: 'Width (cm)', value: flattened.widthCm },
              { label: 'Height (cm)', value: flattened.heightCm },
              
              { label: 'Length (in)', value: flattened.lengthInch },
              { label: 'Width (in)', value: flattened.widthInch },
              { label: 'Height (in)', value: flattened.heightInch },
              
              { label: 'Weight (g)', value: flattened.weightG },
              { label: 'Weight (lb)', value: flattened.weightLb },
            ]}
          />
        </DetailsGridItem>
        
        {/* --- Status Info --- */}
        <DetailsGridItem fullWidth>
          <MemoizedDetailsSection
            sectionTitle="Status"
            fields={[
              {
                label: 'Status',
                value: flattened.statusName,
                format: formatLabel
              },
              {
                label: 'Status Date',
                value: flattened.statusDate,
                format: formatToISODate,
              },
            ]}
          />
        </DetailsGridItem>
        
        {/* --- Audit Info --- */}
        <DetailsGridItem fullWidth>
          <MemoizedDetailsSection
            sectionTitle="Audit"
            fields={[
              { label: 'Created By', value: flattened.createdBy },
              {
                label: 'Created At',
                value: flattened.createdAt,
                format: formatToISODate,
              },
              { label: 'Updated By', value: flattened.updatedBy || '—' },
              {
                label: 'Updated At',
                value: flattened.updatedAt,
                format: formatToISODate,
              },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default SkuInfoSection;
