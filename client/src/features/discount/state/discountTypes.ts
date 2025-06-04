export interface DiscountDropdownItem {
  id: string;
  name: string;
  displayValue: string;
}

export interface DiscountDropdownResponse {
  discounts: DiscountDropdownItem[];
}
