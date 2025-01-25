export interface PaginationInfo {
  limit: number;
  page: number;
  totalPages: number;
  totalRecords: number;
}

export interface UseUsersResponse {
  data: User[]; // User list
  pagination: PaginationInfo; // Pagination details
}

// Represents a user displayed in lists or cards
export interface User {
  fullname: string;
  email: string;
  phone_number: string;
  job_title: string;
  role: string;
  avatar?: string; // Optional avatar URL
}

// Represents the state for a list of users
export interface UsersState {
  users: UseUsersResponse; // Matches the structure returned by fetchUsers
  loading: boolean;
  error: string | null;
}

// Props for a single user card component
export interface UsersCardProps {
  user: User;
}

// Props for a user list component
export interface UsersListProps {
  users: User[];
}

// Represents detailed information about a user's profile
export interface UserProfile {
  email: string;
  role: string;
  firstname: string;
  lastname: string;
  phone_number?: string | null; // Nullable field, optional for profile updates
  job_title: string;
  created_at: string; // ISO timestamp for creation date
  updated_at: string; // ISO timestamp for last update
}

// Response structure for user profile API requests
export interface UserProfileResponse {
  success: boolean; // Indicates whether the request was successful
  message: string; // Message describing the operation's result
  data: UserProfile; // The user profile object
  timestamp: string; // ISO timestamp when the response was generated
}
