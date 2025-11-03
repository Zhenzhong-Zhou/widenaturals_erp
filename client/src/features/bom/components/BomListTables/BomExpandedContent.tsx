import { type FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { FlattenedBomRecord } from '@features/bom/state';

/**
 * Expanded detail section for a BOM record row.
 *
 * Uses the shared <DetailsSection /> component for consistent
 * layout, formatting, and responsive behavior.
 */
interface BomExpandedContentProps {
  row: FlattenedBomRecord;
}

const BomExpandedContent: FC<BomExpandedContentProps> = ({ row }) => {
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        BOM Information Overview
      </CustomTypography>

      {/* --- BOM Core Info --- */}
      <DetailsSection
        sectionTitle="BOM Identification"
        fields={[
          { label: 'BOM Code', value: row.bomCode, format: formatLabel },
          {
            label: 'Description',
            value: row.bomDescription,
            format: formatLabel,
          },
          { label: 'Status', value: row.status, format: formatLabel },
          {
            label: 'Status Date',
            value: row.statusDate,
            format: formatDateTime,
          },
        ]}
      />

      {/* --- Product / SKU --- */}
      <DetailsSection
        sectionTitle="Product / SKU Attributes"
        fields={[
          { label: 'Series', value: row.series, format: formatLabel },
          { label: 'Barcode', value: row.barcode, format: formatLabel },
          { label: 'Size Label', value: row.sizeLabel, format: formatLabel },
          { label: 'Language', value: row.language },
          { label: 'Country Code', value: row.countryCode },
          {
            label: 'SKU Description',
            value: row.skuDescription,
            format: formatLabel,
          },
        ]}
      />

      {/* --- Compliance --- */}
      <DetailsSection
        sectionTitle="Compliance Information"
        fields={[
          { label: 'Compliance Type', value: row.complianceType },
          { label: 'NPN Number', value: row.npnNumber },
          {
            label: 'Issued Date',
            value: row.complianceIssuedDate,
            format: formatDateTime,
          },
          {
            label: 'Expiry Date',
            value: row.complianceExpiryDate,
            format: formatDateTime,
          },
        ]}
      />

      {/* --- Audit Trail --- */}
      <DetailsSection
        sectionTitle="Audit Trail"
        fields={[
          { label: 'Created By', value: row.createdBy, format: formatLabel },
          { label: 'Created At', value: row.createdAt, format: formatDateTime },
          { label: 'Updated By', value: row.updatedBy, format: formatLabel },
          { label: 'Updated At', value: row.updatedAt, format: formatDateTime },
        ]}
      />
    </Box>
  );
};

export default BomExpandedContent;
