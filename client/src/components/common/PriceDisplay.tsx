import type { FC } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';

interface Price {
  location_type?: string;
  location?: string;
  pricing_type: string;
  price: number;
  valid_from?: string;
  valid_to?: string | null;
}

interface PriceDisplayProps {
  prices: Price[];
  originalPrice?: number;
  currency?: string;
}

const PriceDisplay: FC<PriceDisplayProps> = ({
                                               prices,
                                               originalPrice,
                                               currency = '$',
                                             }) => {
  const { theme } = useThemeContext();
  
  // Find retail price for comparison (if needed)
  const retail = prices.find((p) => p.pricing_type === 'Retail');
  const retailPrice = retail?.price;
  
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
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[1],
      }}
    >
      {prices.map(({ pricing_type, price, location, location_type }) => (
        <Box
          key={`${pricing_type}-${location || 'default'}`}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ minHeight: 32 }}
        >
          <Box>
            <CustomTypography variant="body2" sx={{ fontWeight: 600 }}>
              {pricing_type}
            </CustomTypography>
            {(location || location_type) && (
              <CustomTypography
                variant="caption"
                sx={{ color: theme.palette.text.secondary }}
              >
                {location} {location_type && `(${location_type})`}
              </CustomTypography>
            )}
          </Box>
          
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
              backgroundColor: `${theme.palette.error.light}22`,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            -
            {Math.round(
              ((originalPrice - retailPrice) / originalPrice) * 100
            )}
            %
          </CustomTypography>
        </Box>
      )}
    </Box>
  );
};

export default PriceDisplay;
