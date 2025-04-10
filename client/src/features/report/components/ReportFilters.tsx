import { lazy } from 'react';
import Dropdown from '@components/common/Dropdown';
import { BaseReportParams } from '@features/report';
import { formatDate } from '@utils/dateTimeUtils';

const CustomDatePicker = lazy(() => import('@components/common/CustomDatePicker'));

interface ReportFiltersProps<T extends BaseReportParams> {
  filters: T;
  setFilters: (filters: Partial<T>) => void;
}

/**
 * Reusable Report Filters Component for Adjustment Reports, Inventory Logs, and Inventory History.
 */
const ReportFilters = <T extends BaseReportParams>({
  filters,
  setFilters,
}: ReportFiltersProps<T>) => {
  const reportTypeOptions = [
    { value: null, label: 'Select A Type' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const handleReportTypeChange = (value: string | null) => {
    setFilters({
      reportType: value,
      startDate: value ? null : filters.startDate,
      endDate: value ? null : filters.endDate,
    } as Partial<T>);
  };

  const handleStartDateChange = (date: Date | null) => {
    setFilters({
      startDate: date ? formatDate(date) : null,
    } as Partial<T>);
  };

  const handleEndDateChange = (date: Date | null) => {
    setFilters({
      endDate: date ? formatDate(date) : null,
    } as Partial<T>);
  };

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <Dropdown
        label="Report Type"
        options={reportTypeOptions}
        value={filters.reportType || ''}
        onChange={handleReportTypeChange}
      />
      <CustomDatePicker
        label="Start Date"
        value={
          filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : null
        }
        onChange={handleStartDateChange}
        disabled={!!filters.reportType}
      />
      <CustomDatePicker
        label="End Date"
        value={filters.endDate ? new Date(`${filters.endDate}T00:00:00`) : null}
        onChange={handleEndDateChange}
        disabled={!!filters.reportType}
      />
    </div>
  );
};

export default ReportFilters;
