import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import type { FC } from 'react';
import { pricingService } from '@services/pricingService';
import { toast } from 'react-toastify';

export interface ExportPricingFormProps {
  onClose: () => void;
}

const exportFields: FieldConfig[] = [
  {
    id: 'exportFormat',
    label: 'Export Format',
    type: 'select',
    required: true,
    defaultValue: 'csv',
    options: [
      { value: 'csv', label: 'CSV' },
      { value: 'xlsx', label: 'Excel (.xlsx)' },
      { value: 'txt', label: 'Text (.txt)' },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    type: 'select',
    required: false,
    options: [
      { value: 'Canaherb', label: 'Canaherb' },
      { value: 'Phyto-Genious', label: 'Phyto-Genious' },
      { value: 'WIDE Naturals', label: 'WIDE Naturals' },
    ],
  },
  {
    id: 'countryCode',
    label: 'Country Code',
    type: 'select',
    required: false,
    options: [
      { value: 'CA', label: 'Canada' },
      { value: 'CN', label: 'China' },
      { value: 'UN', label: 'Universe' },
    ],
  },
  {
    id: 'pricingType',
    label: 'Pricing Type',
    type: 'select',
    required: false,
    options: [
      { value: 'Retail', label: 'Retail' },
      { value: 'Wholesale', label: 'Wholesale' },
      { value: 'MSRP', label: 'MSRP' },
      { value: 'Friend and Family Price', label: 'Friend and Family Price' },
    ],
  },
  {
    id: 'sizeLabel',
    label: 'Size Label',
    type: 'select',
    required: false,
    options: [
      { value: '60 Capsules', label: '60 Capsules' },
      { value: '30 Softgels', label: '30 Softgels' },
      { value: '60 Softgels', label: '60 Softgels' },
      { value: '120 Softgels', label: '120 Softgels' },
      { value: '180 Softgels', label: '180 Softgels' },
    ],
  },
];

const ExportPricingForm: FC<ExportPricingFormProps> = ({ onClose }) => {
  const handleExportSubmit = async (formData: Record<string, any>) => {
    try {
      const { exportFormat, ...rawFilters } = formData;

      const filters = Object.fromEntries(
        Object.entries(rawFilters).filter(([_, value]) => value !== '')
      );

      await pricingService.exportPricingRecords(
        { filters },
        exportFormat as 'csv' | 'xlsx' | 'txt'
      );

      toast.success('Export successful!');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export pricing records.');
    } finally {
      onClose();
    }
  };

  return (
    <CustomForm
      fields={exportFields}
      initialValues={{
        exportFormat: 'csv',
        brand: 'Canaherb',
      }}
      onSubmit={handleExportSubmit}
      submitButtonLabel="Export"
    />
  );
};

export default ExportPricingForm;
