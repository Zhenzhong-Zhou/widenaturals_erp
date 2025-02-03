export interface ServiceStatus {
  status: string; // Example: 'healthy'
}

export interface Services {
  database: ServiceStatus;
  pool: ServiceStatus;
}

export interface HealthState {
  server: string; // Example: 'healthy'
  services: Services;
  timestamp: string; // ISO timestamp string
  loading: boolean; // Add loading state
  error: string | null; // Include error state
}
