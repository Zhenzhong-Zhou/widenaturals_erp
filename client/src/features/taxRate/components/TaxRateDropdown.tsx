import { type FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Loading from '@components/common/Loading';
import Dropdown from '@components/common/Dropdown';
import type { TaxRateDropdownItem } from '@features/taxRate';
import useTaxRateDropdown from '@hooks/useTaxRateDropdown';

interface TaxRateDropdownProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  region?: string;
  province?: string | null;
  onAddNew?: () => void;
  disabled?: boolean;
}

const TaxRateDropdown: FC<TaxRateDropdownProps> = ({
  label = 'Select Tax Rate',
  value,
  onChange,
  region = 'Canada',
  province = '',
  onAddNew,
  disabled = false,
}) => {
  const { taxRates, loading, error, refreshTaxRates } = useTaxRateDropdown(
    region,
    province
  );
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );

  // Format tax rates for the Dropdown component
  useEffect(() => {
    if (taxRates.length > 0) {
      const formattedOptions = taxRates.map((rate: TaxRateDropdownItem) => ({
        value: rate.value,
        label: rate.label,
      }));
      setOptions(formattedOptions);
    }
  }, [taxRates]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Loading />
      </Box>
    );
  }

  if (error) {
    return <div>Error loading tax rates: {error}</div>;
  }

  return (
    <Dropdown
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      onAddNew={onAddNew}
      onRefresh={refreshTaxRates}
      disabled={disabled}
      searchable
    />
  );
};

export default TaxRateDropdown;
