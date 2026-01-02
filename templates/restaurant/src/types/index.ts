// ============================================================================
// Type Definitions for Restaurant Template
// ============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  modifierGroups?: ModifierGroup[];
  dietaryTags?: DietaryTag[];
  available: boolean;
  prepTime?: number; // minutes
  calories?: number;
  featured?: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free' | 'spicy' | 'dairy-free' | 'nut-free';

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
}

export interface CartItem {
  id: string; // Unique cart item ID
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedModifiers?: SelectedModifier[];
  specialInstructions?: string;
  subtotal: number; // price * quantity + modifiers
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  modifierName: string;
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  type: 'pickup' | 'delivery';
  address?: Address;
  estimatedTime?: string; // ISO string
  placedAt: string; // ISO string
  updatedAt: string; // ISO string
  customerNotes?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  modifiers?: SelectedModifier[];
  specialInstructions?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface Address {
  id: string;
  label: string; // "Home", "Work", etc.
  street: string;
  city: string;
  state: string;
  zipCode: string;
  deliveryInstructions?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (item: MenuItem, quantity: number, modifiers?: SelectedModifier[], instructions?: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
}
