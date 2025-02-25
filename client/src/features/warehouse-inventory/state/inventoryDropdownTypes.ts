export interface ProductDropdownItem {
  product_id: string;
  product_name: string;
  warehouse_id?: string;
}

export interface WarehouseDropdownItem {
  id: string;
  name: string;
}

export interface DropdownState {
  products: ProductDropdownItem[];
  warehouses: WarehouseDropdownItem[];
  loading: boolean;
  error: string | null;
}
