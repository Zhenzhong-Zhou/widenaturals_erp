// Interface representing each delivery method item
export interface DeliveryMethodDropdownItem {
  id: string; // Unique identifier for the delivery method (UUID)
  name: string; // Name of the delivery method (e.g., 'Express Shipping')
  estimatedTime: {
    days: number; // Number of days estimated for delivery or pickup
  };
}

// Type representing the API response which is an array of DeliveryMethodItem
export type DeliveryMethodDropdownResponse = DeliveryMethodDropdownItem[];
