import { type FC, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Dropdown from '@components/common/Dropdown';
import Loading from '@components/common/Loading';
import useProductOrderDropdown from '@hooks/useProductOrderDropdown';

interface ProductOrderDropdownProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  disabled?: boolean;
  search?: string | null;
  limit?: number;
}

// Type for the formatted options passed to the Dropdown
interface FormattedOption {
  value: string;
  label: string;
}

const ProductOrderDropdown: FC<ProductOrderDropdownProps> = ({
  label = 'Select Product',
  value,
  onChange,
  onAddNew,
  disabled = false,
  search = null,
  limit = 100,
}) => {
  const { products, loading, error, refreshProducts } = useProductOrderDropdown(
    search,
    limit
  );
  const [options, setOptions] = useState<FormattedOption[]>([]);

  // Update options when products data changes
  useEffect(() => {
    if (products.length > 0) {
      setOptions(
        products.map((product) => ({
          value: product.id, // Corrected: Keeping the original `id` field
          label: product.label, // Keeping the label as is
        }))
      );
    }
  }, [products]);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center">
        <Loading />
      </Box>
    );
  }

  if (error) {
    return <div>Error loading products: {error}</div>;
  }

  return (
    <Dropdown
      label={label}
      options={options}
      value={value}
      onChange={onChange}
      onAddNew={onAddNew}
      onRefresh={refreshProducts}
      disabled={disabled}
      searchable
    />
  );
};

export default ProductOrderDropdown;
