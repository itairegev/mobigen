# E-commerce Template

Full-featured e-commerce React Native template for Mobigen.

## Overview

The e-commerce template provides a complete shopping app experience with product browsing, cart management, checkout flow, and order tracking.

## Features

- Product catalog with categories
- Product search and filtering
- Product details with images
- Shopping cart management
- Checkout flow
- Order history
- User profile
- Wishlist
- Reviews and ratings

## Structure

```
ecommerce/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Home/Shop
│   │   ├── categories.tsx   # Category listing
│   │   ├── cart.tsx         # Shopping cart
│   │   └── profile.tsx      # User profile
│   ├── product/
│   │   └── [id].tsx         # Product detail
│   ├── checkout/
│   │   ├── index.tsx        # Checkout flow
│   │   ├── shipping.tsx     # Shipping info
│   │   └── payment.tsx      # Payment
│   ├── orders/
│   │   ├── index.tsx        # Order history
│   │   └── [id].tsx         # Order detail
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   └── ProductReviews.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartButton.tsx
│   ├── checkout/
│   │   ├── AddressForm.tsx
│   │   └── PaymentForm.tsx
│   └── ui/
│       └── ...
├── hooks/
│   ├── useCart.ts
│   ├── useProducts.ts
│   ├── useOrders.ts
│   └── useWishlist.ts
├── services/
│   ├── api.ts
│   ├── products.ts
│   ├── cart.ts
│   └── orders.ts
├── types/
│   ├── product.ts
│   ├── cart.ts
│   └── order.ts
└── ...
```

## Screens

### Home/Shop

- Featured products
- Categories grid
- Popular items
- Recent views

### Product Detail

- Image gallery
- Product info
- Size/variant selection
- Add to cart
- Reviews

### Cart

- Cart items list
- Quantity controls
- Price summary
- Checkout button

### Checkout

- Shipping address
- Delivery options
- Payment method
- Order summary
- Place order

### Orders

- Order history
- Order status
- Order details

## Data Types

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  variants?: Variant[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
}
```

### Cart Item

```typescript
interface CartItem {
  product: Product;
  quantity: number;
  variant?: Variant;
}
```

### Order

```typescript
interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  createdAt: Date;
}
```

## Hooks

### useCart

```typescript
const { items, addItem, removeItem, updateQuantity, total, clear } = useCart();

// Add to cart
addItem(product, quantity, variant);

// Update quantity
updateQuantity(itemId, newQuantity);
```

### useProducts

```typescript
const { products, loading, error, search, filter } = useProducts();

// Search products
search('shoes');

// Filter by category
filter({ category: 'clothing' });
```

## API Integration

The template includes mock services that can be replaced with real APIs:

```typescript
// services/products.ts
export async function getProducts(params?: ProductParams): Promise<Product[]> {
  // Replace with actual API call
  return mockProducts;
}

export async function getProduct(id: string): Promise<Product> {
  // Replace with actual API call
  return mockProducts.find(p => p.id === id);
}
```

## Customization

### Adding Payment Providers

Integrate payment providers in `services/payment.ts`:

```typescript
export async function processPayment(paymentData: PaymentData) {
  // Stripe, PayPal, etc.
}
```

### Adding Product Features

Extend the Product type and components for additional features like:

- Size guides
- Color swatches
- Inventory levels
- Pre-orders

## Use Cases

- Online stores
- Marketplace apps
- Fashion apps
- Grocery delivery
- Restaurant ordering

## Related Templates

- [base](../base/) - Minimal starter
- [loyalty](../loyalty/) - Add loyalty features
