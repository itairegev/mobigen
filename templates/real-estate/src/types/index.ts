export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'commercial';

export type PropertyStatus = 'for-sale' | 'for-rent' | 'sold' | 'rented' | 'pending';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  pricePerSqft?: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSize?: number;
  yearBuilt?: number;
  images: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    lat?: number;
    lng?: number;
  };
  features: string[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  rating: number;
  reviewCount: number;
  listingsCount: number;
  yearsExperience: number;
}

export interface Tour {
  id: string;
  propertyId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface SearchFilters {
  type?: PropertyType[];
  status?: PropertyStatus;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqftMin?: number;
  sqftMax?: number;
  city?: string;
  state?: string;
  features?: string[];
}

export interface MortgageParams {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number; // in years
}

export interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  loanAmount: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
}

export interface SavedProperty {
  id: string;
  propertyId: string;
  savedAt: Date;
}
