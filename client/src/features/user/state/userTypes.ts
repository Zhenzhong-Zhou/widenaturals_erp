export interface UserProfile {
  id: string;
  name: string;
  email: string;
  [key: string]: any; // Extendable fields
}
