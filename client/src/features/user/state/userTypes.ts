export interface UserProfile {
  email: string;
  role: string;
  firstname: string;
  lastname: string;
  phone_number: string | null; // Nullable field
  job_title: string;
  created_at: string; // ISO timestamp for creation date
  updated_at: string; // ISO timestamp for last update
}

export interface UserResponse {
  success: boolean; // Indicates whether the request was successful
  message: string;  // Message describing the operation's result
  data: UserProfile; // The user profile object
  timestamp: string; // ISO timestamp when the response was generated
}
