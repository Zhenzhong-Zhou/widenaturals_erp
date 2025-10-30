import { useState, type FC } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import DetailsSection, { type DetailsSectionField } from '@components/common/DetailsSection';
import {
  BomSupplierBreakdownMiniTable,
  BomPartBreakdownMiniTable
} from '@features/bom/components/BomOverview';
import { formatCurrency } from '@utils/textUtils';
import type {
  BomPartSummary,
  BomSupplierSummary,
  FlattenedBomMaterialSupplySummary
} from '@features/bom/state';

interface BomMaterialSupplySummarySectionProps {
  summary: FlattenedBomMaterialSupplySummary | null;
  suppliers: BomSupplierSummary[];
  parts: BomPartSummary[];
}

/**
 * Displays a BOM-level cost summary with an optional expandable section
 * showing supplier and part-level breakdown mini tables.
 *
 * @example
 * <BomMaterialSupplySummarySection
 *   summary={flattenedSummary}
 *   supplierRows={flattenedSummary.suppliers}
 *   partRows={flattenedSummary.parts}
 * />
 */
const BomMaterialSupplySummarySection: FC<BomMaterialSupplySummarySectionProps> = ({
                                                                                     summary,
                                                                                     suppliers,
                                                                                     parts,
                                                                                   }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!summary) return null;
  
  const handleToggle = () => setExpanded((prev) => !prev);
  
  const varianceColor =
    summary.variance > 0
      ? 'error.main'
      : summary.variance < 0
        ? 'success.main'
        : 'text.primary';
  
  const fields: DetailsSectionField[] = [
    { label: 'Base Currency', value: summary.baseCurrency },
    { label: 'Estimated Cost', value: formatCurrency(summary.totalEstimatedCost, summary.baseCurrency) },
    { label: 'Actual Cost', value: formatCurrency(summary.totalActualCost, summary.baseCurrency) },
    {
      label: 'Variance',
      value: summary.variance,
      format: (v) => (
        <Box component="span" sx={{ color: varianceColor }}>
          {formatCurrency(v, summary.baseCurrency)}
        </Box>
      ),
    },
    {
      label: 'Variance (%)',
      value: summary.variancePercentage,
      format: (v: number) => (
        <Box component="span" sx={{ color: varianceColor }}>
          {v.toFixed(2)}%
        </Box>
      ),
    },
    { label: 'Supplier Count', value: summary.supplierCount },
    { label: 'Part Count', value: summary.partCount },
  ];
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <DetailsSection sectionTitle="BOM Cost Overview" fields={fields} />
        
        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <CustomButton
            size="small"
            variant="outlined"
            onClick={handleToggle}
          >
            {expanded ? 'Hide Details' : 'View More Details'}
          </CustomButton>
        </Box>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <CustomTypography variant="body1" color="text.secondary">
              Supplier Breakdown
            </CustomTypography>
            <BomSupplierBreakdownMiniTable data={suppliers} />
            
            <CustomTypography variant="body1" color="text.secondary">
              Part Breakdown
            </CustomTypography>
            <BomPartBreakdownMiniTable data={parts} />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default BomMaterialSupplySummarySection;
