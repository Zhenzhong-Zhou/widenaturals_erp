import type { FC } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import { toISODate } from '@utils/dateTimeUtils';
import type { OrderTypeFilters } from '@features/orderType/state';
import {
  renderBooleanSelectField,
  renderDateField,
  renderInputField,
} from '@utils/filters/filterUtils';

interface Props {
  filters: OrderTypeFilters;
  onChange: (filters: OrderTypeFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: OrderTypeFilters = {
  name: '',
  code: '',
  category: '',
  statusId: '',
  requiresPayment: undefined,
  createdBy: '',
  updatedBy: '',
  keyword: '',
  createdAfter: '',
  createdBefore: '',
  updatedAfter: '',
  updatedBefore: '',
};

const OrderTypeFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const textFields: {
    name: keyof OrderTypeFilters;
    label: string;
    placeholder?: string;
  }[] = [
    { name: 'name', label: 'Name' },
    { name: 'code', label: 'Code' },
    { name: 'category', label: 'Category' },
    { name: 'statusId', label: 'Status ID' },
    { name: 'keyword', label: 'Search Keyword' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'updatedBy', label: 'Updated By' },
  ];

  const dateFields: { name: keyof OrderTypeFilters; label: string }[] = [
    { name: 'createdAfter', label: 'Created After' },
    { name: 'createdBefore', label: 'Created Before' },
    { name: 'updatedAfter', label: 'Updated After' },
    { name: 'updatedBefore', label: 'Updated Before' },
  ];

  const { control, handleSubmit, reset } = useForm<OrderTypeFilters>({
    defaultValues: filters,
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const submitFilters = (data: OrderTypeFilters) => {
    const adjusted: OrderTypeFilters = {
      ...data,
      createdAfter: toISODate(data.createdAfter),
      createdBefore: toISODate(data.createdBefore),
      updatedAfter: toISODate(data.updatedAfter),
      updatedBefore: toISODate(data.updatedBefore),
    };

    onChange(adjusted);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        {textFields.map(({ name, label, placeholder }) =>
          renderInputField(control, name, label, placeholder)
        )}
        {dateFields.map(({ name, label }) =>
          renderDateField(control, name, label)
        )}
        {renderBooleanSelectField(
          control,
          'requiresPayment',
          'Requires Payment'
        )}
      </FilterPanelLayout>
    </form>
  );
};

export default OrderTypeFiltersPanel;
