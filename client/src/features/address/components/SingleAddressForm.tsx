import { type FC, useEffect, useMemo, useState } from 'react';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';
import { emailValidator } from '@utils/validation';
import CustomTypography from '@components/common/CustomTypography.tsx';
import type { CustomerLookupQuery, CustomerOption, LookupPaginationMeta } from '@features/lookup/state';
import CustomerDropdown from '@features/lookup/components/CustomerDropdown';
import { debounce } from '@mui/material';
import { getDisplayName } from '../utils/customerDisplay';

/**
 * Props for the SingleAddressForm component.
 */
interface SingleAddressFormProps {
  loading?: boolean;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  
  /** Optional list of customer IDs (used to pre-fill or lock customer selection) */
  customerIds?: string[];
  
  /** Optional list of customer names (used for display if customerIds is provided) */
  customerNames?: string[];
  
  /** Dropdown-ready customer options */
  customerDropdownOptions?: CustomerOption[];
  
  /** Fetch function to load customer options */
  fetchCustomerDropdownOptions?: (params?: CustomerLookupQuery) => void;
  
  /** Indicates if customer lookup is currently loading */
  customerLookupLoading?: boolean;
  
  /** Optional error from customer lookup */
  customerLookupError?: string | null;
  
  /** Whether more customers are available for pagination */
  hasMore?: boolean;
  
  /** Grouped pagination metadata for customer lookup */
  customerLookupMeta?: LookupPaginationMeta;
}

const SingleAddressForm: FC<SingleAddressFormProps> = ({
                                                         loading,
                                                         onSubmit,
                                                         customerIds,
                                                         customerNames,
                                                         customerDropdownOptions = [],
                                                         fetchCustomerDropdownOptions,
                                                         customerLookupLoading,
                                                         customerLookupError,
                                                         customerLookupMeta,
                                                       }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [fetchParams, setFetchParams] = useState<CustomerLookupQuery>({
    keyword: '',
    limit: 10,
    offset: 0,
  });
  const shouldShowDropdown = !customerIds || customerIds.length === 0;
  
  const debouncedFetch = useMemo(() => debounce((params: CustomerLookupQuery) => {
    fetchCustomerDropdownOptions?.(params);
  }, 300), [fetchCustomerDropdownOptions]);
  
  useEffect(() => {
    if (!customerIds?.length) {
      debouncedFetch(fetchParams);
    }
  }, [fetchParams, customerIds, debouncedFetch]);
  
  const displayName = getDisplayName({
    customerNames,
    customerDropdownOptions,
    selectedCustomerId,
  });
  
  const handleFormSubmit = (data: Record<string, any>) => {
    const enriched = {
      ...data,
      customer_id: customerIds?.[0] ?? selectedCustomerId,
    };
    onSubmit(enriched);
  };
  
  const addressFormFields = useMemo<FieldConfig[]>(() => [
    ...(shouldShowDropdown
      ? [
        {
          id: 'customer_id',
          type: 'custom' as const,
          required: true,
          grid: { xs: 12 },
          customRender: ({
                           value,
                           onChange,
                           required: _required,
                         }: {
            value?: any;
            onChange?: (val: any) => void;
            required?: boolean;
          } = {}) => (
            <CustomerDropdown
              label="Customer"
              value={value ?? ''}
              onChange={(id) => {
                onChange?.(id);
                setSelectedCustomerId(id);
              }}
              inputValue={inputValue}
              onInputChange={(_e, newVal) => {
                setInputValue(newVal);
                setFetchParams((prev) => ({
                  ...prev,
                  keyword: newVal,
                  offset: 0,
                }));
              }}
              options={customerDropdownOptions}
              loading={customerLookupLoading}
              error={customerLookupError}
              paginationMeta={customerLookupMeta}
              fetchParams={fetchParams}
              setFetchParams={setFetchParams}
              onRefresh={(params) => fetchCustomerDropdownOptions?.(params)}
            />
          ),
        },
      ]
      : []), // fallback to an empty array if dropdown should not be shown
    { id: 'label', label: 'Label', type: 'text', required: false, grid: { xs: 12, sm: 6 } },
    { id: 'full_name', label: 'Recipient Name', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
    { id: 'phone', label: 'Phone Number', type: 'phone', required: true, grid: { xs: 12, sm: 6 } },
    { id: 'email', label: 'Email', type: 'email', required: true, validation: emailValidator, grid: { xs: 12, sm: 6 } },
    { id: 'address_line1', label: 'Address Line 1', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
    { id: 'address_line2', label: 'Address Line 2', type: 'text', required: false, grid: { xs: 12, sm: 6 } },
    { id: 'city', label: 'City', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
    { id: 'state', label: 'State / Province', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
    { id: 'postal_code', label: 'Postal Code', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
    { id: 'country', label: 'Country', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
    { id: 'region', label: 'Region', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
    { id: 'note', label: 'Note', type: 'textarea', grid: { xs: 12 } },
  ], [
    shouldShowDropdown,
    inputValue,
    fetchParams,
    setFetchParams,
    customerDropdownOptions,
    customerLookupLoading,
    customerLookupError,
    customerLookupMeta,
    fetchCustomerDropdownOptions,
    setSelectedCustomerId,
  ]);
  
  return (
    <>
      <CustomTypography variant="subtitle1" sx={{ mb: 1 }}>
        Adding address for: {displayName}
      </CustomTypography>
      
      <CustomForm
        fields={addressFormFields}
        onSubmit={handleFormSubmit}
        submitButtonLabel="Create Address"
        disabled={loading}
        showSubmitButton
        sx={{ maxWidth: { xs: '100%', sm: '800px' } }}
      />
    </>
  );
};

export default SingleAddressForm;
