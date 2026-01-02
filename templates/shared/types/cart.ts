/**
 * Cart and checkout-related types
 */

import { BaseEntity, Address, PaymentMethod } from './common';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: ProductVariant;
  modifiers?: Modifier[];
  subtotal: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  attributes: {
    [key: string]: string; // e.g., { size: "Large", color: "Red" }
  };
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  tip: number;
  total: number;
  itemCount: number;
}

export interface CheckoutData {
  cart: Cart;
  deliveryAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: PaymentMethod;
  deliveryInstructions?: string;
  scheduledDelivery?: Date;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  tip: number;
  total: number;
  status: OrderStatus;
  type: 'pickup' | 'delivery' | 'dine-in';
  deliveryAddress?: Address;
  paymentMethod: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: ProductVariant;
  modifiers?: Modifier[];
  subtotal: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  estimatedTime?: Date;
  driver?: {
    name: string;
    phone: string;
    photo?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: Date;
  message: string;
}
