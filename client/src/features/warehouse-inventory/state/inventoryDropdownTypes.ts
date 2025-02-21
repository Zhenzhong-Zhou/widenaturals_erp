export interface ProductDropdownItem {
  id: string;
  product_name: string;
}

export interface WarehouseDropdownItem {
  id: string;
  name: string;
}

export interface DropdownState {
  products: ProductDropdownItem[];
  warehouses: WarehouseDropdownItem[];
  loading: boolean;
}
