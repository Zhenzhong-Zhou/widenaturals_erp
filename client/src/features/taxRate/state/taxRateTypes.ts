export interface TaxRateDropdownItem {
  value: string;      // The unique identifier of the tax rate (UUID)
  label: string;       // The formatted label to display in the dropdown (e.g., "GST (5.00%)")
}

// Type for the API response
export type TaxRateDropdownResponse = TaxRateDropdownItem[];