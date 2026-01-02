## Template: restaurant

### Screens (10)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - Hooks: useCart
  - JSX: Tabs, Tabs.Screen, Home, UtensilsCrossed, View...
- **CartScreen** (src/app/(tabs)/cart.tsx)
  - Hooks: useCart
  - JSX: SafeAreaView, View, ShoppingCart, Text, TouchableOpacity...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useFeaturedItems, useCategories
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, Text...
- **MenuScreen** (src/app/(tabs)/menu.tsx)
  - Hooks: useState, useCategories, useMenuItems
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, MenuCategory...
- **OrdersScreen** (src/app/(tabs)/orders.tsx)
  - Hooks: useOrders, useActiveOrders
  - JSX: SafeAreaView, View, ActivityIndicator, ClipboardList, Text...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - JSX: SafeAreaView, ScrollView, View, User, Text...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **CheckoutScreen** (src/app/checkout.tsx)
  - Hooks: useCart, useQuery, usePlaceOrder, useState
  - JSX: SafeAreaView, View, ScrollView, Text, DeliveryToggle...
- **MenuItemDetailScreen** (src/app/menu/[id].tsx)
  - Hooks: useLocalSearchParams, useMenuItem, useCart, useState
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, Image...
- **OrderDetailScreen** (src/app/orders/[id].tsx)
  - Hooks: useLocalSearchParams, useOrder
  - JSX: SafeAreaView, View, ActivityIndicator, ScrollView, Text...

### Components (11)
- **AddressSelector**: 0 hooks, 5 elements
- **CartItem**: 0 hooks, 7 elements
- **CartSummary**: 0 hooks, 2 elements
- **DeliveryToggle**: 0 hooks, 5 elements
- **MenuCategory**: 0 hooks, 2 elements
- **MenuItem**: 0 hooks, 4 elements
- **ModifierSelector**: 0 hooks, 4 elements
- **OrderCard**: 0 hooks, 4 elements
- **OrderStatus**: 0 hooks, 3 elements
- **TipSelector**: 0 hooks, 3 elements
- **index**: 0 hooks, 0 elements

### Hooks (3)
- **useCart**: deps []
- **useMenu**: deps [useQuery]
- **useOrders**: deps [useQuery, useQueryClient, useMutation]

### Services (2)
- **menu**: getCategories(async), getMenuItems(async), getFeaturedItems(async), getMenuItem(async), searchMenuItems(async)
- **orders**: getOrders(async), getOrder(async), getActiveOrders(async), getAddresses(async), placeOrder(async), getOrderStatusDisplay()

### Navigation (expo-router)
- cart -> Cart
- index -> Index
- menu -> Menu
- orders -> Orders
- profile -> Profile
- checkout -> Checkout
- [id] -> [id]
- [id] -> [id]

### Types (12)
- interface MenuItem
- interface ModifierGroup
- interface Modifier
- type DietaryTag
- interface Category
- interface CartItem
- interface SelectedModifier
- interface Order
- interface OrderItem
- type OrderStatus
- interface Address
- interface CartState