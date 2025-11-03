import { useWatch } from 'react-hook-form';
import { type FC, useMemo } from 'react';
import BaseInput from '@components/common/BaseInput.tsx';
import CustomTypography from '@components/common/CustomTypography.tsx';
import type { LookupOption } from '@features/lookup/state';

interface PriceFieldProps {
  control: any;
  value: any;
  onChange: (value: any) => void;
  rowIndex: number;
  pricingOptions: LookupOption[];
}

const extractPriceFromLabel = (label: string): number => {
  if (!label) return 0;

  const match = label.match(/\$([\d.,]+)/);
  if (!match || !match[1]) {
    console.warn('Price not found in label:', label);
    return 0;
  }

  const priceStr = match[1].replace(',', '');
  const parsed = parseFloat(priceStr);

  return isNaN(parsed) ? 0 : parsed;
};

const PriceField: FC<PriceFieldProps> = ({
  control,
  value,
  onChange,
  rowIndex,
  pricingOptions,
}) => {
  const overridePrice = useWatch({
    control,
    name: `items.${rowIndex}.override_price`,
  });

  const selectedPriceId = useWatch({
    control,
    name: `items.${rowIndex}.price_id`,
  });

  const selectedPricing = useMemo(
    () => pricingOptions.find((opt) => opt.value === selectedPriceId),
    [selectedPriceId, pricingOptions]
  );

  const defaultPrice = useMemo(
    () => extractPriceFromLabel(selectedPricing?.label ?? ''),
    [selectedPricing]
  );

  return overridePrice ? (
    <BaseInput
      label="Price"
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      size="small"
      fullWidth
    />
  ) : (
    <CustomTypography variant="body2" sx={{ mt: 1.5 }}>
      Price: ${defaultPrice.toFixed(2)}
    </CustomTypography>
  );
};

export default PriceField;
