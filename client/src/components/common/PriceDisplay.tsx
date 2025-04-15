import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';

interface Price {
  price: number;
  pricing_type: string;
}

interface PriceDisplayProps {
  prices: Price[]; // Array of prices
  originalPrice?: number; // Optional original price
  currency?: string; // Optional, default: "$"
}

const PriceDisplay: FC<PriceDisplayProps> = ({
  prices,
  originalPrice,
  currency = '$',
}) => {
  const { theme } = useThemeContext();
  
  // Find retail price for comparison (if needed)
  const retailPrice = prices.find((p) => p.pricing_type === 'Retail')?.price;

  // Determine if there is a discount
  const isDiscounted =
    typeof originalPrice === 'number' &&
    typeof retailPrice === 'number' &&
    originalPrice > retailPrice;

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={theme.spacing(1)}
      sx={{
        padding: theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Iterate through prices */}
      {prices.map(({ pricing_type, price }) => (
        <Box
          key={pricing_type}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ minHeight: 32 }}
        >
          <CustomTypography
            variant="body2"
            sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
          >
            {pricing_type}
          </CustomTypography>
          <CustomTypography
            variant="body2"
            sx={{ color: theme.palette.primary.main, fontWeight: 600 }}
          >
            {currency}
            {price.toFixed(2)}
          </CustomTypography>
        </Box>
      ))}
      
      {/* Discount Info */}
      {isDiscounted && retailPrice && (
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          {/* Original Price */}
          <CustomTypography
            variant="body2"
            sx={{
              color: theme.palette.text.disabled,
              textDecoration: 'line-through',
            }}
          >
            {currency}
            {originalPrice.toFixed(2)}
          </CustomTypography>

          {/* Discount Percentage */}
          <CustomTypography
            variant="caption"
            sx={{
              color: theme.palette.error.main,
              backgroundColor: theme.palette.error.light + '22', // semi-transparent
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            -
            {Math.round(
              ((originalPrice - retailPrice!) / originalPrice) * 100
            )}
            %
          </CustomTypography>
        </Box>
      )}
    </Box>
  );
};

export default PriceDisplay;
