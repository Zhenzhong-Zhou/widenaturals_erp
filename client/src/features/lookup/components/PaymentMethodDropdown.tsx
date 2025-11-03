import { useMemo } from 'react';
import type { PaymentMethodLookupQueryParams } from '@features/lookup/state';
import type { PaginatedDropdownProps } from '@components/common/PaginatedDropdown';
import PaginatedDropdown from '@components/common/PaginatedDropdown';
import CustomTypography from '@components/common/CustomTypography';
import type { IconDefinition } from '@fortawesome/free-regular-svg-icons';
import {
  faCreditCard,
  faMoneyCheck,
  faUniversity,
  faExchangeAlt,
  faMoneyBillWave,
  faFileInvoiceDollar,
  faPaperPlane,
  faHourglassHalf,
  faStore,
  faGift,
  faRandom,
  faBan,
} from '@fortawesome/free-solid-svg-icons';
import {
  faPaypal,
  faApple,
  faGoogle,
  faBitcoin,
} from '@fortawesome/free-brands-svg-icons';
import { getRawLabel } from '@utils/labelHelpers';

type PaymentMethodDropdownProps =
  PaginatedDropdownProps<PaymentMethodLookupQueryParams>;

/**
 * Dropdown component for selecting a payment method from the lookup list.
 *
 * - Enriches raw options with UI metadata (`displayLabel`, `icon`, `tooltip`, `iconColor`).
 * - Uses `getPaymentMethodIcon` and `getPaymentMethodIconColor` to assign distinct icons and colors
 *   for known payment methods (e.g., Credit Card, PayPal, Apple Pay).
 * - Marks inactive methods with red text, a gray ban icon, and appropriate tooltip.
 * - Keeps a plain string `label` for Autocomplete input stability, and a `displayLabel` (JSX) for dropdown rendering.
 *
 * Fully controlled via props: `value`, `options`, `onChange`, and optional actions.
 * Supports pagination, keyword filtering, and server-driven lookups.
 *
 * @component
 * @param {PaymentMethodDropdownProps} props - Props controlling dropdown behavior.
 */
const PaymentMethodDropdown = ({
  options = [],
  ...rest
}: PaymentMethodDropdownProps) => {
  /**
   * Maps a payment method label to a corresponding FontAwesome icon.
   *
   * Used to visually differentiate payment methods in dropdowns and forms.
   * Falls back to `faCreditCard` if the label is unknown.
   *
   * @param {string} label - Payment method name (case-insensitive).
   * @returns {IconDefinition} FontAwesome icon representing the payment method.
   *
   * @example
   * getPaymentMethodIcon("PayPal") // => faPaypal
   * getPaymentMethodIcon("Cash")   // => faMoneyBillWave
   */
  const getPaymentMethodIcon = (label: string): IconDefinition => {
    switch (label.toLowerCase()) {
      case 'credit card':
        return faCreditCard;
      case 'debit card':
        return faMoneyCheck;
      case 'paypal':
        return faPaypal;
      case 'apple pay':
        return faApple;
      case 'google pay':
        return faGoogle;
      case 'bank transfer':
        return faUniversity;
      case 'wire transfer':
        return faExchangeAlt;
      case 'cash':
        return faMoneyBillWave;
      case 'cheque':
        return faFileInvoiceDollar;
      case 'e-transfer':
        return faPaperPlane;
      case 'net terms (net 30)':
        return faHourglassHalf;
      case 'store credit':
        return faStore;
      case 'gift card':
        return faGift;
      case 'ach':
        return faRandom;
      case 'crypto':
        return faBitcoin; // or faCoins
      default:
        return faCreditCard;
    }
  };

  /**
   * Maps a payment method label to a color string for consistent UI theming.
   *
   * Colors are chosen to reflect intuitive or brand-related associations:
   * - Cash → green
   * - Credit/Debit → blue
   * - Crypto → gold
   *
   * @param {string} label - Payment method name (case-insensitive).
   * @returns {string} CSS color string representing the payment method.
   *
   * @example
   * getPaymentMethodIconColor("Cash")   // => "green"
   * getPaymentMethodIconColor("Crypto") // => "gold"
   */
  const getPaymentMethodIconColor = (label: string): string => {
    switch (label.toLowerCase()) {
      case 'credit card':
      case 'debit card':
        return 'blue'; // Financial standard cards

      case 'paypal':
      case 'apple pay':
      case 'google pay':
        return 'black'; // Branded/pay app neutral tone

      case 'bank transfer':
      case 'wire transfer':
        return 'teal'; // Trusted banking tone

      case 'cash':
        return 'green'; // Obvious cash = green

      case 'cheque':
        return 'brown'; // Traditional

      case 'e-transfer':
        return 'purple'; // Digital yet distinct

      case 'net terms (net 30)':
        return 'gray'; // Deferred payments

      case 'store credit':
        return 'indigo'; // Internal balance

      case 'gift card':
        return 'orange'; // Gift = highlight

      case 'ach':
        return 'darkgreen'; // System-level money transfer

      case 'crypto':
        return 'gold'; // Coin look

      default:
        return 'gray'; // Fallback
    }
  };

  const enrichedPaymentMethodOptions = useMemo(() => {
    return Array.from(
      new Map(
        options.map((opt) => {
          const isInactive = opt.isActive === false;

          // Stable string for input/equality
          const rawLabel = getRawLabel(opt.label);

          // JSX for dropdown rendering
          const displayLabel = (
            <CustomTypography color={isInactive ? 'error' : 'inherit'}>
              {rawLabel}
            </CustomTypography>
          );

          const icon = isInactive ? faBan : getPaymentMethodIcon(rawLabel);
          const iconColor = isInactive
            ? 'gray'
            : getPaymentMethodIconColor(rawLabel);
          const tooltip = isInactive ? 'Inactive Payment Method' : rawLabel;

          return [
            opt.value ?? opt.id,
            {
              ...opt,
              label: rawLabel,
              displayLabel,
              icon,
              tooltip,
              iconColor,
            },
          ];
        })
      ).values()
    );
  }, [options]);

  return (
    <PaginatedDropdown
      label="Select Payment Method"
      options={enrichedPaymentMethodOptions}
      {...rest}
    />
  );
};

export default PaymentMethodDropdown;
