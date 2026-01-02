/**
 * Common types used across templates
 */

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  label?: string; // e.g., "Home", "Work"
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Image {
  id: string;
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  query: string;
  filters?: FilterParams;
  sort?: SortParams;
  pagination?: PaginationParams;
}

export type Status = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface BaseEntity extends Timestamps {
  id: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  sortOrder?: number;
  parentId?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface Rating {
  average: number;
  count: number;
  distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful?: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Price {
  amount: number;
  currency: string;
  formatted?: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: Date;
}
