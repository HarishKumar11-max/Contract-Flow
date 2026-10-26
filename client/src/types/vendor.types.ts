export type VendorCategory = 
  | 'Software/SaaS' 
  | 'Hardware' 
  | 'Professional Services' 
  | 'Consulting' 
  | 'Logistics' 
  | 'Other';

export type VendorStatus = 'Active' | 'Under Review' | 'Suspended' | 'Terminated';
export type RiskScore = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Vendor {
  _id: string;
  name: string;
  code: string;
  category: VendorCategory;
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  taxId: string;
  status: VendorStatus;
  performanceRating: number;
  riskScore: RiskScore;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorListResponse {
  vendors: Vendor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: {
    totalVendors: number;
    activeVendors: number;
    highRiskVendors: number;
    avgPerformanceRating: number;
  };
}
