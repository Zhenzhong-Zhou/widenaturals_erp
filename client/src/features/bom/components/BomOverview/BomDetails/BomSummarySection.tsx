import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedBomSummary } from '@features/bom/state/bomTypes';

interface BomSummarySectionProps {
  /** Flattened BOM summary data for display */
  flattenedSummary: FlattenedBomSummary | null;
}

/**
 * Displays summarized BOM information such as total cost, currency, and item count.
 */
const BomSummarySection: FC<BomSummarySectionProps> = ({
  flattenedSummary,
}) => {
  if (!flattenedSummary) return null;

  const {
    summaryType,
    summaryDescription,
    summaryCurrency,
    summaryItemCount,
    summaryTotalEstimatedCost,
  } = flattenedSummary;

  return (
    <Section title="BOM Summary">
      <DetailsGrid>
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Type', value: summaryType || '—' },
              { label: 'Currency', value: summaryCurrency || '—' },
              { label: 'Description', value: summaryDescription || '—' },
            ]}
          />
        </DetailsGridItem>

        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              {
                label: 'Total Estimated Cost',
                value:
                  summaryTotalEstimatedCost !== null &&
                  summaryTotalEstimatedCost !== undefined
                    ? summaryTotalEstimatedCost.toFixed(4)
                    : '—',
              },
              { label: 'Item Count', value: summaryItemCount ?? '—' },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default BomSummarySection;
