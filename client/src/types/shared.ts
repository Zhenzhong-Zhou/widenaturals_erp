/**
 * Represents creation mode options for forms or data entry flows.
 * Typically used to switch between creating a single record or multiple records (bulk).
 */
export type CreateMode = 'single' | 'bulk';

/**
 * Generic definition for a single filter field in a filter panel.
 *
 * `FilterField<T>` is used to describe the structure of a UI filter input
 * (text, number, boolean, or select). It is strongly typed by the shape of
 * the filter object `T`, ensuring the filter names always match the
 * backend/query model.
 *
 * @template T - The filter object type (e.g., SkuProductCardFilters)
 */
export type FilterField<T extends object> = {
  /**
   * The key in the filter object (`T`) that this field controls.
   * Ensures type-safe mapping between UI fields and backend filters.
   */
  name: keyof T;
  
  /** Human-readable label displayed in the UI */
  label: string;
  
  /**
   * Optional placeholder text for text/number input fields.
   * Ignored for select or boolean fields.
   */
  placeholder?: string;
  
  /**
   * Input control type:
   * - "text" → free text input
   * - "number" → numeric input
   * - "boolean" → true/false selector
   * - "select" → dropdown with predefined options
   *
   * Default is "text" when omitted.
   */
  type?: 'text' | 'number' | 'boolean' | 'select';
  
  /**
   * Available values for select dropdowns.
   * Required when `type === "select"`.
   *
   * Each option contains:
   *  - `label` → UI text shown to the user
   *  - `value` → actual value stored in filter state
   */
  options?: Array<{ label: string; value: any }>;
};
