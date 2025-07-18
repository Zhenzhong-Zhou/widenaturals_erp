import { type Dispatch, type FC, type SetStateAction, useMemo, useState } from 'react';
import MultiItemForm, { type MultiItemFieldConfig } from '@components/common/MultiItemForm';
import { emailValidator } from '@utils/validation';
import type { CustomerLookupQuery, CustomerOption, LookupPaginationMeta } from '@features/lookup/state';
import CustomerDropdown from '@features/lookup/components/CustomerDropdown';
import { getDisplayName } from '../utils/customerDisplay';

export interface BulkAddressFormProps {
  defaultValues?: Record<string, any>[];
  onSubmit: (addresses: Record<string, any>[]) => void;
  loading?: boolean;
  customerIds?: string[];
  customerNames?: string[];
  customerDropdownOptions?: CustomerOption[];
  fetchCustomerDropdownOptions?: (params?: CustomerLookupQuery) => void;
  customerLookupLoading?: boolean;
  customerLookupError?: string | null;
  customerLookupMeta?: LookupPaginationMeta;
}

const BulkAddressForm: FC<BulkAddressFormProps> = ({
                                                     defaultValues,
                                                     onSubmit,
                                                     loading,
                                                     customerIds,
                                                     customerNames,
                                                     customerDropdownOptions = [],
                                                     fetchCustomerDropdownOptions,
                                                     customerLookupLoading,
                                                     customerLookupError,
                                                     customerLookupMeta,
                                                   }) => {
  const initialLength = defaultValues?.length ?? 1;
  
  const [inputValues, setInputValues] = useState<string[]>(
    Array.from({ length: initialLength }, () => '')
  );
  
  const [fetchParamsArray, setFetchParamsArray] = useState<CustomerLookupQuery[]>(
    Array.from({ length: initialLength }, () => ({ keyword: '', limit: 10, offset: 0 }))
  );
  
  const shouldShowDropdown = !customerIds || customerIds.length === 0;
  
  const addressFields = useMemo<MultiItemFieldConfig[]>(() => [
    ...(shouldShowDropdown
      ? [
        {
          id: 'customer_id',
          label: 'Customer',
          type: 'custom' as const,
          required: true,
          component: ({
                        value,
                        onChange,
                        rowIndex,
                      }: {
            value: string;
            onChange: (value: string) => void;
            rowIndex: number;
          }) => {
          const inputValue = inputValues[rowIndex] ?? '';
          const fetchParams = fetchParamsArray[rowIndex] ?? { keyword: '', limit: 10, offset: 0 };
          
          const getSetFetchParamsForRow = (index: number): Dispatch<SetStateAction<CustomerLookupQuery>> => {
            return (newValueOrUpdater) => {
              setFetchParamsArray((prev) => {
                const copy = [...prev];
                const current = prev[index] ?? { keyword: '', limit: 10, offset: 0 };
  
                copy[index] = typeof newValueOrUpdater === 'function'
                  ? newValueOrUpdater(current)
                  : newValueOrUpdater;
                return copy;
              });
            };
          };
          
          const updateInputValue = (index: number, val: string) => {
            setInputValues((prev) => {
              const copy = [...prev];
              copy[index] = val;
              return copy;
            });
          };
          
          return (
            <CustomerDropdown
              label="Customer"
              value={value ?? ''}
              onChange={(id) => {
                onChange?.(id);
              }}
              inputValue={inputValue}
              onInputChange={(_e, newVal) => {
                updateInputValue(rowIndex, newVal);
                getSetFetchParamsForRow(rowIndex)((prev) => ({
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
              setFetchParams={getSetFetchParamsForRow(rowIndex)}
              onRefresh={(params) => fetchCustomerDropdownOptions?.(params)}
            />
          );
          },
        },
      ]
      : []),
    { id: 'label', label: 'Label', type: 'text', required: false, group: 'basic' },
    { id: 'full_name', label: 'Recipient Name', type: 'text', required: true, group: 'basic' },
    { id: 'phone', label: 'Phone Number', type: 'phone', required: true, group: 'basic' },
    { id: 'email', label: 'Email', type: 'email', required: true, validation: emailValidator, group: 'basic' },
    { id: 'address_line1', label: 'Address Line 1', type: 'text', required: true, group: 'address' },
    { id: 'address_line2', label: 'Address Line 2', type: 'text', required: false, group: 'address' },
    { id: 'city', label: 'City', type: 'text', required: true, group: 'address' },
    { id: 'state', label: 'State / Province', type: 'text', required: true, group: 'address' },
    { id: 'postal_code', label: 'Postal Code', type: 'text', required: true, group: 'address', grid: { xs: 12, sm: 4 } },
    { id: 'country', label: 'Country', type: 'text', required: true, group: 'address', grid: { xs: 12, sm: 4 } },
    { id: 'region', label: 'Region', type: 'text', required: true, group: 'address', grid: { xs: 12, sm: 4 } },
    { id: 'note', label: 'Note', type: 'textarea', group: 'note' },
  ], [
    inputValues,
    fetchParamsArray,
    customerDropdownOptions,
    customerLookupLoading,
    customerLookupError,
    customerLookupMeta,
    fetchCustomerDropdownOptions,
  ]);
  
  return (
    <MultiItemForm
      fields={addressFields}
      onSubmit={onSubmit}
      loading={loading}
      validation={() =>
        Object.fromEntries(
          addressFields.filter((f) => f.validation).map((f) => [f.id, f.validation!])
        )
      }
      getItemTitle={(index, item) => {
        if (item.full_name) return item.full_name;
        
        const name = getDisplayName({
          customerNames,
          customerDropdownOptions,
          selectedCustomerId: item.customer_id,
        });
        
        return name === 'N/A' ? `Address #${index + 1}` : name;
      }}
    />
  );
};

export default BulkAddressForm;
