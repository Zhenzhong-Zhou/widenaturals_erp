import { FC } from "react";
import { Typography } from "@mui/material";
import { Box } from "@mui/material";

interface Price {
  price: number;
  pricing_type: string;
}

interface PriceDisplayProps {
  prices: Price[]; // Array of prices
  originalPrice?: number; // Optional original price
  currency?: string; // Optional, default: "$"
}

const PriceDisplay: FC<PriceDisplayProps> = ({ prices, originalPrice, currency = "$" }) => {
  // Find retail price for comparison (if needed)
  const retailPrice = prices.find((p) => p.pricing_type === "Retail")?.price;
  
  // Determine if there is a discount
  const isDiscounted = originalPrice && retailPrice && originalPrice > retailPrice;
  
  return (
    <Box display="flex" flexDirection="column" gap={1}>
      {/* Iterate through prices */}
      {prices.map((priceObj) => (
        <Box key={priceObj.pricing_type} display="flex" alignItems="center" gap={1}>
          <Typography variant="body1" color="primary">
            {priceObj.pricing_type}: {currency}
            {priceObj.price.toFixed(2)}
          </Typography>
        </Box>
      ))}
      
      {isDiscounted && retailPrice && (
        <Box display="flex" alignItems="center" gap={1}>
          {/* Original Price */}
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ textDecoration: "line-through" }}
          >
            {currency}
            {originalPrice.toFixed(2)}
          </Typography>
          
          {/* Discount Percentage */}
          <Typography
            variant="caption"
            color="error"
            sx={{
              backgroundColor: "rgba(255,0,0,0.1)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            -{Math.round(((originalPrice - retailPrice) / originalPrice) * 100)}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PriceDisplay;
