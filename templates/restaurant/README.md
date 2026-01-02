# Restaurant & Food Ordering Template

A complete, production-ready React Native + Expo template for restaurant and food ordering apps.

## Features

- 📱 **Complete Food Ordering Flow**: Browse menu, customize items, checkout, and track orders
- 🍕 **Menu Management**: Categories, modifiers, dietary tags, featured items
- 🛒 **Shopping Cart**: Add/remove items, modify quantities, apply modifiers
- 🚚 **Pickup & Delivery**: Toggle between order types with delivery address selection
- 💰 **Flexible Pricing**: Modifiers, tips, taxes, delivery fees
- 📦 **Order Tracking**: Real-time order status with timeline visualization
- 🎨 **Beautiful UI**: Warm, appetizing color scheme optimized for food apps
- 🧪 **E2E Testing**: Maestro test flows for critical user journeys

## Template Structure

```
restaurant/
├── src/
│   ├── app/                     # Expo Router screens
│   │   ├── (tabs)/              # Main tab navigation
│   │   │   ├── index.tsx        # Home: Featured items & categories
│   │   │   ├── menu.tsx         # Full menu browser
│   │   │   ├── cart.tsx         # Shopping cart
│   │   │   ├── orders.tsx       # Order history
│   │   │   └── profile.tsx      # User profile
│   │   ├── menu/[id].tsx        # Item detail with modifiers
│   │   ├── checkout.tsx         # Checkout flow
│   │   └── orders/[id].tsx      # Order tracking
│   │
│   ├── components/              # Reusable UI components
│   │   ├── MenuItem.tsx         # Menu item card
│   │   ├── MenuCategory.tsx     # Category filter
│   │   ├── CartItem.tsx         # Cart item with quantity controls
│   │   ├── CartSummary.tsx      # Order total breakdown
│   │   ├── OrderCard.tsx        # Order history item
│   │   ├── OrderStatus.tsx      # Order status timeline
│   │   ├── ModifierSelector.tsx # Add-ons/options selector
│   │   ├── AddressSelector.tsx  # Delivery address picker
│   │   ├── TipSelector.tsx      # Tip amount selector
│   │   └── DeliveryToggle.tsx   # Pickup/delivery toggle
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useCart.ts           # Cart state (Zustand)
│   │   ├── useMenu.ts           # Menu queries (React Query)
│   │   └── useOrders.ts         # Order queries & mutations
│   │
│   ├── services/                # Mock data services
│   │   ├── menu.ts              # Menu items & categories
│   │   └── orders.ts            # Order management
│   │
│   ├── types/                   # TypeScript interfaces
│   │   └── index.ts
│   │
│   └── theme/                   # Theme configuration
│       └── colors.ts
│
├── .maestro/                    # E2E test flows
│   ├── browse-menu.yaml
│   ├── add-to-cart.yaml
│   ├── checkout-flow.yaml
│   └── track-order.yaml
│
└── app.json                     # Expo configuration
```

## Data Models

### MenuItem
- ID, name, description, price, image
- Category, dietary tags, prep time, calories
- Modifier groups (optional add-ons)

### ModifierGroup
- Name, required/optional, min/max selections
- Individual modifiers with prices

### Order
- Items, pricing breakdown (subtotal, tax, tip, delivery fee)
- Order type (pickup/delivery), delivery address
- Status tracking (pending → confirmed → preparing → ready/delivered)

### CartItem
- Menu item reference, quantity, selected modifiers
- Special instructions, calculated subtotal

## Mock Data

The template includes realistic mock data:
- **5 categories**: Appetizers, Main Courses, Pizza & Pasta, Desserts, Beverages
- **20 menu items**: Diverse selection with images, descriptions, prices
- **Modifiers**: Examples like cooking temperature, add-ons, protein options
- **5 sample orders**: Various statuses to demonstrate tracking UI
- **2 saved addresses**: For delivery testing

## State Management

- **Cart**: Zustand for global cart state
- **Server Data**: React Query for menu/order fetching
- **Local State**: React hooks for UI state

## Theme

Warm, appetizing color palette:
- **Primary**: Orange (#ff6b35) - stimulates appetite
- **Secondary**: Warm brown tones
- **Accents**: Green for dietary tags, status indicators

## E2E Test Flows

1. **browse-menu.yaml**: Navigate menu, filter by category
2. **add-to-cart.yaml**: Add item with modifiers to cart
3. **checkout-flow.yaml**: Complete order placement
4. **track-order.yaml**: View active and past orders

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run E2E tests
maestro test .maestro/
```

## Customization Points

**AI-Friendly Modifications**:
- Update brand colors in `tailwind.config.js`
- Add/remove menu categories in `services/menu.ts`
- Customize modifier options per item type
- Adjust tax rate and delivery fee calculations
- Modify order status steps for your workflow

## Template Metadata

- **Category**: Local Business
- **Target Audience**: Restaurants, cafes, food trucks, bakeries
- **Key Use Case**: Avoid 30% delivery platform fees, own customer data
- **White-Label Ready**: Unique bundle ID, branding, AWS resources per app

---

Built with ❤️ using Mobigen
