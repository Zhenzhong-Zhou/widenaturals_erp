import type { PaymentMethodLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';

type PaymentMethodDropdownProps = PaginatedDropdownProps<PaymentMethodLookupQueryParams>;

/**
 * Dropdown component for selecting a payment method from the lookup list.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 */
export const PaymentMethodDropdown = (props: PaymentMethodDropdownProps) => (
  <PaginatedDropdown label="Select Payment Method" {...props} />
);

export default PaymentMethodDropdown;
