import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedBomHeader } from '@features/bom/state';
import { formatLabel } from '@utils/textUtils';
import { formatToISODate } from '@utils/dateTimeUtils';

interface BomHeaderSectionProps {
  flattened: FlattenedBomHeader;
}

/**
 * Displays key BOM header metadata including product, SKU, compliance,
 * and BOM record information in a structured grid layout.
 */
const BomHeaderSection: FC<BomHeaderSectionProps> = ({ flattened }) => {
  return (
    <Section title="BOM Header">
      <DetailsGrid>
        {/* --- Product Info --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            sectionTitle="Product Info"
            fields={[
              { label: 'Product Name', value: flattened.productName || '—' },
              { label: 'Brand', value: flattened.productBrand || '—' },
              { label: 'Series', value: flattened.productSeries || '—' },
              { label: 'Category', value: flattened.productCategory || '—' },
            ]}
          />
        </DetailsGridItem>

        {/* --- SKU Info --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            sectionTitle="SKU Info"
            fields={[
              { label: 'SKU Code', value: flattened.skuCode || '—' },
              { label: 'Barcode', value: flattened.skuBarcode || '—' },
              { label: 'Size Label', value: flattened.skuSizeLabel || '—' },
              {
                label: 'Market Region',
                value: flattened.skuMarketRegion || '—',
              },
            ]}
          />
        </DetailsGridItem>

        {/* --- Compliance Info --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            sectionTitle="Compliance"
            fields={[
              { label: 'Type', value: flattened.complianceType || '—' },
              { label: 'Number', value: flattened.complianceNumber || '—' },
              {
                label: 'Status',
                value: flattened.complianceStatus || '—',
                format: formatLabel,
              },
              {
                label: 'Issued Date',
                value: flattened.complianceIssuedDate || '—',
                format: formatToISODate,
              },
            ]}
          />
        </DetailsGridItem>

        {/* --- BOM Info --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            sectionTitle="BOM Info"
            fields={[
              { label: 'BOM Name', value: flattened.bomName || '—' },
              { label: 'BOM Code', value: flattened.bomCode || '—' },
              { label: 'Revision', value: flattened.bomRevision || '—' },
              {
                label: 'Status',
                value: formatLabel(flattened.bomStatus) || '—',
                format: formatLabel,
              },
            ]}
          />
        </DetailsGridItem>

        {/* --- Audit Info --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            sectionTitle="Audit Info"
            fields={[
              { label: 'Created By', value: flattened.bomCreatedBy || '—' },
              { label: 'Updated By', value: flattened.bomUpdatedBy || '—' },
              {
                label: 'Created At',
                value: flattened.bomCreatedAt || '—',
                format: formatToISODate,
              },
              {
                label: 'Updated At',
                value: flattened.bomUpdatedAt || '—',
                format: formatToISODate,
              },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default BomHeaderSection;
