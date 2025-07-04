import type {
  ApiSuccessResponse, CreatedUpdatedByFilter,
  CreatedUpdatedDateFilter,
  MutationState,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

/**
 * Represents a single address input record for creation or update.
 *
 * - Used in client-side forms, API requests, or service calls.
 * - Includes physical location fields and optional metadata.
 *
 * @property {string | null} customer_id - Linked customer ID (nullable for guest or standalone address).
 * @property {string | null} [full_name] - Recipient's full name (optional).
 * @property {string | null} [phone] - Recipient's phone number in international format (optional).
 * @property {string | null} [email] - Recipient's email (optional).
 * @property {string | null} [label] - Address label (e.g., Home, Work, Shipping) (optional).
 * @property {string} address_line1 - The main address line (required).
 * @property {string | null} [address_line2] - Additional address info (e.g., unit, suite) (optional).
 * @property {string} city - City name (required).
 * @property {string | null} [state] - State or province (optional, depending on country).
 * @property {string} postal_code - Postal or ZIP code (required).
 * @property {string} country - Country code or name (required).
 * @property {string | null} [region] - Region, province, or territory (optional).
 * @property {string | null} [note] - Additional delivery note (optional).
 */
export interface AddressInput {
  customer_id: string | null;          // UUID or null for guest / standalone address
  full_name?: string | null;           // Recipient's full name
  phone?: string | null;               // Phone in international format
  email?: string | null;               // Optional email
  label?: string | null;               // e.g., "Home", "Shipping"
  address_line1: string;               // Required
  address_line2?: string | null;       // Optional
  city: string;                        // Required
  state?: string | null;               // Optional (depending on country)
  postal_code: string;                 // Required
  country: string;                     // Required
  region?: string | null;              // Optional, for provinces, territories, etc.
  note?: string | null;                // Optional delivery instructions
}

/**
 * Represents an array of address input records.
 *
 * - Used in bulk creation or update operations.
 * - Each element must conform to the `AddressInput` structure.
 *
 * @type {AddressInput[]}
 */
export type AddressInputArray = AddressInput[];

/**
 * Represents a detailed address record returned by the API.
 */
export interface AddressResponse {
  id: string;
  customerId: string | null;
  recipientName: string | null;
  phone: string | null;
  email: string | null;
  label: string | null;
  displayAddress: string;
  note: string | null;
  customer: AddressCustomerSummary;
  createdBy: AddressUserSummary;
  updatedBy: AddressUserSummary;
  createdAt: string;  // ISO string
  updatedAt?: string | null; // Optional, since not shown in example
}

/**
 * A minimal summary of customer info associated with the address.
 */
export interface AddressCustomerSummary {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

/**
 * Contains basic information about the user who created or updated the address record.
 */
export interface AddressUserSummary {
  firstname: string | null;
  lastname: string | null;
  fullName: string;
}

/**
 * Represents the API response when creating a single address.
 *
 * - `data` contains a single `AddressResponse` object.
 * - `success` and `message` provide API-level status info.
 */
export type CreateSingleAddressResponse = ApiSuccessResponse<AddressResponse>;

/**
 * Represents the API response when creating multiple addresses (bulk insert).
 *
 * - `data` contains an array of `AddressResponse` objects.
 * - Useful when the API supports creating multiple addresses in one call.
 */
export type CreateBulkAddressResponse = ApiSuccessResponse<AddressResponse[]>;

/**
 * Represents the API response for creating addresses, supporting both single and bulk insert cases.
 *
 * This is a union of `CreateSingleAddressResponse` and `CreateBulkAddressResponse`.
 * It allows the reducer or service layer to handle either type of response dynamically.
 */
export type CreateAddressApiResponse =
  | CreateSingleAddressResponse
  | CreateBulkAddressResponse;

/**
 * Represents the client-side state for address creation in Redux (RTK).
 *
 * - `data`: Always normalized to an array of `AddressResponse` (even for single-item creation).
 * - `loading`: Indicates if a creation request is in progress.
 * - `error`: Contains an error message if the request fails.
 * - `success`: Indicates if the last request succeeded.
 * - `message`: Optional message from the API.
 */
export type AddressCreationState = MutationState<AddressResponse[]>;

/**
 * Filter conditions for querying address records.
 *
 * Includes standard audit fields (created/updated dates and user IDs),
 * along with address-specific fields like country, city, region, customer ID, and keyword search.
 */
export interface AddressFilterConditions
  extends CreatedUpdatedDateFilter,
    CreatedUpdatedByFilter {
  /** Filter by country code or name */
  country?: string;
  
  /** Filter by city name */
  city?: string;
  
  /** Filter by region or province name */
  region?: string;
  
  /** Filter by associated customer ID (UUID v4) */
  customerId?: string;
  
  /** Keyword search across label, recipient name, email, phone, city */
  keyword?: string;
}

/**
 * Query parameters for paginated address API requests.
 *
 * Combines pagination, sorting, and filter conditions.
 * Intended for constructing API calls that list addresses with flexible criteria.
 */
export interface AddressQueryParams extends PaginationParams, SortConfig {
  /** Optional filter conditions to apply to the address query */
  filters?: AddressFilterConditions;
}

/**
 * Represents a single address item as returned in a paginated API response.
 * Contains both address details and associated customer metadata.
 */
export interface AddressListItem {
  /** Unique identifier for the address */
  id: string;
  
  /** Associated customer ID */
  customerId: string;
  
  /** Customer's display name */
  customerName: string;
  
  /** Customer's email address */
  customerEmail: string;
  
  /** Label for the address (e.g. "Home", "Office") */
  label: string;
  
  /** Name of the recipient for this address */
  recipientName: string;
  
  /** Recipient's phone number */
  phone: string;
  
  /** Recipient's email address */
  email: string;
  
  /** Structured address details */
  address: {
    /** First line of the address (e.g. street, building) */
    line1: string;
    
    /** City name */
    city: string;
    
    /** State or province */
    state: string;
    
    /** Postal or ZIP code */
    postalCode: string;
    
    /** Country */
    country: string;
    
    /** Region (if applicable) */
    region: string;
  };
  
  /** Pre-formatted address string for display purposes */
  displayAddress: string;
  
  /** ISO timestamp of when the address was created */
  createdAt: string;
  
  /** User who created the address (display name or ID) */
  createdBy: string;
  
  /** User who last updated the address (display name or ID) */
  updatedBy: string;
}

/**
 * API response type for a paginated address list request.
 * Wraps the list of addresses along with pagination metadata.
 */
export type PaginatedAddressResponse = PaginatedResponse<AddressListItem>;

/**
 * Redux state type for paginated address data.
 *
 * Wraps {@link AddressListItem} with pagination, loading, and error tracking,
 * based on the generic {@link ReduxPaginatedState} structure.
 *
 * Used in paginated address slices to manage address list views.
 */
export type PaginateAddressState = ReduxPaginatedState<AddressListItem>;
