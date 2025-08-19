import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import { formatCurrency } from '@utils/textUtils';

interface OrderSummarySectionProps {
  subtotal: number;
  discount?: number;
  taxRate: string;
  tax: number;
  shipping?: number;
  total: number;
  baseCurrencyAmount: number;
}

const OrderSummarySection = ({
                               subtotal,
                               discount = 0,
                               tax = 0,
                               taxRate = '',
                               shipping = 0,
                               total,
                               baseCurrencyAmount,
                             }: OrderSummarySectionProps) => {
  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Stack spacing={1}>
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        {discount > 0 && <Row label="Discount" value={formatCurrency(discount)} />}
        {taxRate && <Row label="Tax Rate" value={taxRate} />}
        {tax > 0 && <Row label="Tax" value={formatCurrency(tax)} />}
        {shipping > 0 && <Row label="Shipping" value={formatCurrency(shipping)} />}
        <Row label="Total" value={formatCurrency(total)} bold />
        <Row label="Currency Amount" value={formatCurrency(baseCurrencyAmount)} bold />
      </Stack>
    </Box>
  );
};

const Row = ({
               label,
               value,
               bold = false,
             }: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <Box
    display="grid"
    gridTemplateColumns="1500px auto"
    alignItems="center"
    width="100%"
  >
    <CustomTypography
      variant="body2"
      fontWeight={bold ? 'bold' : 'normal'}
      sx={{ minWidth: 80, textAlign: 'right' }}
    >
      {label}
    </CustomTypography>
    <CustomTypography
      variant="body2"
      fontWeight={bold ? 'bold' : 'normal'}
      sx={{ minWidth: 80, textAlign: 'right' }}
    >
      {value}
    </CustomTypography>
  </Box>
);

export default OrderSummarySection;
