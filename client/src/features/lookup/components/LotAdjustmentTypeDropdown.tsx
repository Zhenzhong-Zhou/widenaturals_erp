import { type FC } from 'react';
import Dropdown from '@components/common/Dropdown';

interface LotAdjustmentTypeDropdownProps {
  label?: string;
  value: string | null;
  lotAdjustmentTypeOptions: { value: string; label: string }[];
  lotAdjustmentTypeLoading?: boolean;
  lotAdjustmentTypeError?: string | null;
  onChange: (value: string) => void;
  onRefresh: () => void;
  onAddNew?: () => void;
  disabled?: boolean;
}

/**
 * Reusable dropdown component for selecting lot adjustment types.
 *
 */
const LotAdjustmentTypeDropdown: FC<LotAdjustmentTypeDropdownProps> = ({
                                                                         label = 'Select Lot Adjustment Type',
                                                                         value,
                                                                         lotAdjustmentTypeOptions,
                                                                         lotAdjustmentTypeLoading = false,
                                                                         lotAdjustmentTypeError = null,
                                                                         onChange,
                                                                         onRefresh,
                                                                         onAddNew,
                                                                         disabled = false,
                                                                       }) => {
  return (
    <Dropdown
      label={label}
      value={value}
      options={lotAdjustmentTypeOptions}
      onChange={onChange}
      loading={lotAdjustmentTypeLoading}
      error={lotAdjustmentTypeError}
      onRefresh={onRefresh}
      onAddNew={onAddNew}
      disabled={disabled}
    />
  );
};

export default LotAdjustmentTypeDropdown;
