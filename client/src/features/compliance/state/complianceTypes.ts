export interface FetchAllCompliancesParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export type ComplianceType =
  | 'NPN' // Canada - Natural Product Number
  | 'DIN' // Canada - Drug Identification Number
  | 'FDA' // USA - FDA Approval
  | 'GRAS' // USA - Generally Recognized as Safe
  | 'USP' // USA - United States Pharmacopeia
  | 'NSF' // USA & Canada - National Sanitation Foundation
  | 'Organic_USA' // USDA Organic Certification
  | 'GMP' // Good Manufacturing Practices (USA, Canada, Australia)
  | 'AUST_L' // Australia - Listed Medicine Number
  | 'AUST_R' // Australia - Registered Medicine Number
  | 'FSANZ' // Australia & NZ - Food Safety Standards
  | 'TGA' // Australia - Therapeutic Goods Administration
  | 'Organic_AUS' // Australia - Certified Organic
  | 'BlueHat' // China - Health Food Registration
  | 'SFDA' // China - State Food and Drug Administration
  | 'CFDA' // China - China Food and Drug Administration
  | 'GB_Standard' // China - National Food Safety Standard
  | 'CCC' // China - Compulsory Certification
  | 'Organic_CNCA'; // China - Organic Certification

export interface Compliance {
  id: string;
  product_id: string;
  product_name: string;
  type: ComplianceType;
  compliance_id: string;
  issued_date: string | null;
  expiry_date: string | null;
  description: string;
  status_name: string;
  status_date: string;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  updated_by: string;
}

export interface CompliancePagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface ComplianceResponse {
  success: boolean;
  message: string;
  data: Compliance[];
  pagination: CompliancePagination;
}
