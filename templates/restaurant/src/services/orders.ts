import { Order, OrderStatus, Address, CartItem } from '@/types';

// ============================================================================
// Mock Addresses
// ============================================================================

export const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    label: 'Home',
    street: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    deliveryInstructions: 'Ring doorbell',
  },
  {
    id: '2',
    label: 'Work',
    street: '456 Market Street, Suite 800',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    deliveryInstructions: 'Leave with reception',
  },
];

// ============================================================================
// Mock Orders
// ============================================================================

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    items: [
      {
        id: '1',
        menuItemId: '10',
        name: 'Margherita Pizza',
        quantity: 1,
        price: 14.99,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      },
      {
        id: '2',
        menuItemId: '18',
        name: 'Fresh Lemonade',
        quantity: 2,
        price: 3.99,
        image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=400',
      },
    ],
    subtotal: 22.97,
    tax: 2.07,
    tip: 4.00,
    deliveryFee: 3.99,
    total: 33.03,
    status: 'delivered',
    type: 'delivery',
    address: MOCK_ADDRESSES[0],
    placedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-002',
    items: [
      {
        id: '3',
        menuItemId: '6',
        name: 'Ribeye Steak',
        quantity: 1,
        price: 32.99,
        image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400',
        modifiers: [
          {
            groupId: 'mg2',
            groupName: 'Cooking Temperature',
            modifierId: 'm5',
            modifierName: 'Medium Rare',
            price: 0,
          },
          {
            groupId: 'mg3',
            groupName: 'Add-ons',
            modifierId: 'm9',
            modifierName: 'Grilled Shrimp',
            price: 6.99,
          },
        ],
      },
      {
        id: '4',
        menuItemId: '15',
        name: 'Tiramisu',
        quantity: 1,
        price: 8.99,
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
      },
    ],
    subtotal: 48.97,
    tax: 4.41,
    tip: 9.00,
    deliveryFee: 0,
    total: 62.38,
    status: 'completed',
    type: 'pickup',
    placedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ORD-003',
    items: [
      {
        id: '5',
        menuItemId: '11',
        name: 'Pepperoni Pizza',
        quantity: 2,
        price: 16.99,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
      },
    ],
    subtotal: 33.98,
    tax: 3.06,
    tip: 5.00,
    deliveryFee: 3.99,
    total: 46.03,
    status: 'preparing',
    type: 'delivery',
    address: MOCK_ADDRESSES[1],
    estimatedTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(), // 25 minutes from now
    placedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ORD-004',
    items: [
      {
        id: '6',
        menuItemId: '5',
        name: 'Grilled Salmon',
        quantity: 1,
        price: 22.99,
        image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400',
        modifiers: [
          {
            groupId: 'mg1',
            groupName: 'Side Options',
            modifierId: 'm3',
            modifierName: 'Grilled Vegetables',
            price: 0,
          },
        ],
      },
      {
        id: '7',
        menuItemId: '16',
        name: 'Chocolate Lava Cake',
        quantity: 1,
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
      },
    ],
    subtotal: 32.98,
    tax: 2.97,
    tip: 6.00,
    deliveryFee: 0,
    total: 41.95,
    status: 'ready',
    type: 'pickup',
    estimatedTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    placedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ORD-005',
    items: [
      {
        id: '8',
        menuItemId: '2',
        name: 'Bruschetta',
        quantity: 1,
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
      },
      {
        id: '9',
        menuItemId: '12',
        name: 'Fettuccine Alfredo',
        quantity: 1,
        price: 17.99,
        image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400',
        modifiers: [
          {
            groupId: 'mg4',
            groupName: 'Add Protein',
            modifierId: 'm12',
            modifierName: 'Grilled Chicken',
            price: 5.99,
          },
        ],
      },
    ],
    subtotal: 33.97,
    tax: 3.06,
    tip: 6.00,
    deliveryFee: 3.99,
    total: 47.02,
    status: 'confirmed',
    type: 'delivery',
    address: MOCK_ADDRESSES[0],
    estimatedTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(), // 35 minutes from now
    placedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// Service Functions
// ============================================================================

export async function getOrders(): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_ORDERS].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export async function getOrder(id: string): Promise<Order | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ORDERS.find((order) => order.id === id) || null;
}

export async function getActiveOrders(): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery'];
  return MOCK_ORDERS.filter((order) => activeStatuses.includes(order.status)).sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  );
}

export async function getAddresses(): Promise<Address[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [...MOCK_ADDRESSES];
}

export async function placeOrder(
  items: CartItem[],
  type: 'pickup' | 'delivery',
  addressId?: string,
  tip?: number,
  customerNotes?: string
): Promise<Order> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.09; // 9% tax
  const deliveryFee = type === 'delivery' ? 3.99 : 0;
  const orderTip = tip || 0;
  const total = subtotal + tax + deliveryFee + orderTip;

  const address = addressId ? MOCK_ADDRESSES.find((a) => a.id === addressId) : undefined;

  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    items: items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      modifiers: item.selectedModifiers,
      specialInstructions: item.specialInstructions,
    })),
    subtotal,
    tax,
    tip: orderTip,
    deliveryFee,
    total,
    status: 'pending',
    type,
    address,
    estimatedTime: new Date(Date.now() + (type === 'delivery' ? 40 : 25) * 60 * 1000).toISOString(),
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerNotes,
  };

  // Simulate adding to mock data
  MOCK_ORDERS.unshift(newOrder);

  return newOrder;
}

export function getOrderStatusDisplay(status: OrderStatus): {
  label: string;
  description: string;
  color: string;
} {
  const statusMap = {
    pending: {
      label: 'Order Received',
      description: 'Your order has been received',
      color: '#6b7280',
    },
    confirmed: {
      label: 'Confirmed',
      description: 'Restaurant confirmed your order',
      color: '#3b82f6',
    },
    preparing: {
      label: 'Preparing',
      description: 'Your food is being prepared',
      color: '#f59e0b',
    },
    ready: {
      label: 'Ready',
      description: 'Your order is ready for pickup',
      color: '#22c55e',
    },
    'out-for-delivery': {
      label: 'Out for Delivery',
      description: 'Driver is on the way',
      color: '#8b5cf6',
    },
    delivered: {
      label: 'Delivered',
      description: 'Order has been delivered',
      color: '#22c55e',
    },
    completed: {
      label: 'Completed',
      description: 'Order completed',
      color: '#22c55e',
    },
    cancelled: {
      label: 'Cancelled',
      description: 'Order was cancelled',
      color: '#ef4444',
    },
  };

  return statusMap[status];
}
