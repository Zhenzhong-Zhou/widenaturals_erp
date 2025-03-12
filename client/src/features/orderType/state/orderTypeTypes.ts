export type OrderTypeCategory =
  | "purchase"
  | "sales"
  | "transfer"
  | "return"
  | "manufacturing"
  | "logistics"
  | "adjustment";

export interface OrderType {
  id: string;
  name: string;
  category: OrderTypeCategory;
  description: string;
  status_name: string;
  status_date: string;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string;
}

export interface OrderTypeResponse {
  success: boolean;
  message: string;
  data: OrderType[];
}
