# Mobigen Shared Components Library

A comprehensive, production-ready component library for building mobile apps with React Native + Expo. This library provides reusable UI components, hooks, utilities, and types that are shared across all Mobigen templates.

## Features

- **UI Components**: Button, Card, Input, Modal, Badge, Avatar, EmptyState, LoadingSpinner
- **Booking Components**: CalendarPicker, TimeSlotGrid, BookingConfirmation
- **Cart Components**: CartProvider, CartItem, CartSummary
- **Chat Components**: ChatBubble, ChatInput, ConversationList
- **Media Components**: VideoPlayer, AudioPlayer, ImageGallery
- **Feed Components**: FeedList, PostCard
- **Hooks**: useTheme, useAuth, useCart, useBooking, useSearch, usePagination
- **Services**: API client, Storage service
- **Utilities**: Formatters, Validators, Date utilities
- **Types**: Common types for booking, cart, chat, and more
- **Theme**: Color palette and theming system

## Installation

This library is designed to be used within Mobigen templates. It's already included in the template structure.

```bash
# Install dependencies
npm install
```

## Usage

### Components

```tsx
import { Button, Card, Input } from '@mobigen/shared';

function MyScreen() {
  return (
    <Card title="Welcome">
      <Input
        label="Email"
        placeholder="Enter your email"
        testID="email-input"
      />
      <Button
        title="Submit"
        onPress={() => console.log('Pressed')}
        variant="primary"
        testID="submit-button"
      />
    </Card>
  );
}
```

### Hooks

```tsx
import { useAuth, useCart, useTheme } from '@mobigen/shared';

function MyComponent() {
  const { user, signIn } = useAuth();
  const { items, addItem } = useCart();
  const theme = useTheme();

  // Use hooks...
}
```

### Utilities

```tsx
import { formatCurrency, formatDate, isValidEmail } from '@mobigen/shared';

const price = formatCurrency(29.99); // "$29.99"
const date = formatDate(new Date(), 'medium'); // "Jan 15, 2024"
const valid = isValidEmail('test@example.com'); // true
```

### Types

```tsx
import { User, Order, Appointment, CartItem } from '@mobigen/shared';

const user: User = {
  id: '1',
  email: 'test@example.com',
  name: 'John Doe',
};
```

## Components Reference

### UI Components

#### Button
Versatile button component with multiple variants and sizes.

```tsx
<Button
  title="Click me"
  onPress={() => {}}
  variant="primary" // primary | secondary | outline | ghost | danger
  size="md" // sm | md | lg
  disabled={false}
  loading={false}
  fullWidth={false}
  testID="my-button"
/>
```

#### Card
Container component for grouping content.

```tsx
<Card
  title="Card Title"
  subtitle="Optional subtitle"
  variant="elevated" // default | elevated | outlined
  padding="md" // none | sm | md | lg
  onPress={() => {}} // Optional
  testID="my-card"
>
  {children}
</Card>
```

#### Input
Text input with label, error states, and icons.

```tsx
<Input
  label="Email"
  placeholder="Enter email"
  error="Invalid email"
  variant="default" // default | filled | outlined
  leftIcon={<Icon />}
  rightIcon={<Icon />}
  testID="email-input"
/>
```

#### Modal
Customizable modal dialog.

```tsx
<Modal
  visible={isVisible}
  onClose={() => setIsVisible(false)}
  title="Modal Title"
  size="md" // sm | md | lg | full
  position="center" // center | bottom
  showCloseButton={true}
  testID="my-modal"
>
  {children}
</Modal>
```

### Booking Components

#### CalendarPicker
Interactive calendar for date selection.

```tsx
<CalendarPicker
  selectedDate={date}
  onDateSelect={(date) => setDate(date)}
  availableDates={availableDates}
  minDate={new Date()}
  testID="calendar"
/>
```

#### TimeSlotGrid
Grid of available time slots.

```tsx
<TimeSlotGrid
  date={selectedDate}
  slots={availableSlots}
  selectedSlot={slot}
  onSlotSelect={(slot) => setSlot(slot)}
  columns={3}
  testID="time-slots"
/>
```

### Cart Components

#### CartProvider
Context provider for cart state management.

```tsx
import { CartProvider, useCart } from '@mobigen/shared';

function App() {
  return (
    <CartProvider>
      <YourApp />
    </CartProvider>
  );
}

function CartScreen() {
  const { items, addItem, removeItem, clearCart } = useCart();
  // Use cart...
}
```

#### CartItem
Display and manage a single cart item.

```tsx
<CartItem
  item={cartItem}
  onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
  onRemove={(id) => removeItem(id)}
  testID="cart-item"
/>
```

### Chat Components

#### ChatBubble
Message bubble for chat interfaces.

```tsx
<ChatBubble
  message={message}
  isOwn={message.senderId === currentUserId}
  showAvatar={true}
  showTimestamp={true}
  testID="chat-bubble"
/>
```

#### ChatInput
Input field for sending messages.

```tsx
<ChatInput
  onSend={(message) => sendMessage(message)}
  onAttachmentPress={() => pickAttachment()}
  placeholder="Type a message..."
  testID="chat-input"
/>
```

### Media Components

#### VideoPlayer
Video player with controls.

```tsx
<VideoPlayer
  source="https://example.com/video.mp4"
  poster="https://example.com/poster.jpg"
  autoPlay={false}
  onProgress={(progress) => console.log(progress)}
  onComplete={() => console.log('Complete')}
  testID="video-player"
/>
```

#### ImageGallery
Interactive image gallery with lightbox.

```tsx
<ImageGallery
  images={imageUrls}
  initialIndex={0}
  showThumbnails={true}
  columns={3}
  onImagePress={(index) => console.log(index)}
  testID="gallery"
/>
```

## Hooks Reference

### useAuth
Authentication state and methods.

```tsx
const {
  user,
  isLoading,
  isAuthenticated,
  signIn,
  signUp,
  signOut,
  updateProfile,
} = useAuth();
```

### useCart
Cart state management (re-exported from CartProvider).

```tsx
const {
  items,
  subtotal,
  itemCount,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
} = useCart();
```

### useBooking
Booking flow state management.

```tsx
const {
  bookingData,
  setService,
  setStaff,
  setDate,
  setTimeSlot,
  setNotes,
  clearBooking,
  isComplete,
} = useBooking();
```

### useSearch
Search functionality with filtering.

```tsx
const { query, setQuery, results, isSearching, clearSearch } = useSearch({
  data: items,
  searchKeys: ['name', 'description'],
  filterFn: (item, query) => item.name.includes(query),
});
```

### usePagination
Pagination for lists.

```tsx
const {
  currentPage,
  totalPages,
  pageData,
  hasNextPage,
  hasPreviousPage,
  nextPage,
  previousPage,
  goToPage,
} = usePagination({
  data: items,
  itemsPerPage: 10,
});
```

## Utilities Reference

### Formatters

- `formatCurrency(amount, currency, locale)` - Format numbers as currency
- `formatDate(date, format, locale)` - Format dates
- `formatTime(date, options)` - Format times
- `formatRelativeTime(date)` - Format as relative time (e.g., "2 hours ago")
- `formatNumber(num, options)` - Format numbers with commas
- `formatPercent(value, options)` - Format as percentage
- `formatPhoneNumber(phone, format)` - Format phone numbers
- `formatFileSize(bytes)` - Format file sizes
- `truncate(text, maxLength)` - Truncate text with ellipsis

### Validators

- `isValidEmail(email)` - Validate email addresses
- `isValidPhoneUS(phone)` - Validate US phone numbers
- `isValidUrl(url)` - Validate URLs
- `validatePassword(password, options)` - Validate password strength
- `isValidCreditCard(cardNumber)` - Validate credit card numbers
- `isRequired(value)` - Check if value is provided
- `hasMinLength(value, minLength)` - Check minimum length
- `matchesPattern(value, pattern)` - Check regex pattern

### Date Utilities

- `addDays(date, days)` - Add days to a date
- `addMonths(date, months)` - Add months to a date
- `startOfDay(date)` - Get start of day
- `endOfDay(date)` - Get end of day
- `isSameDay(date1, date2)` - Check if dates are same day
- `isToday(date)` - Check if date is today
- `differenceInDays(date1, date2)` - Get difference in days
- `dateRange(startDate, endDate)` - Get array of dates in range

## Design Principles

1. **Type Safety**: All components and utilities are fully typed with TypeScript
2. **Accessibility**: Components include proper testID props for testing
3. **Customization**: Components accept variant and size props for flexibility
4. **Consistency**: Follows NativeWind/Tailwind CSS conventions
5. **Performance**: Optimized for React Native performance
6. **Testability**: All interactive elements have testID props

## Contributing

This library is maintained as part of the Mobigen project. Follow these guidelines:

1. All components must be TypeScript
2. Use NativeWind for styling
3. Include testID props on interactive elements
4. Export types alongside components
5. Document props with JSDoc comments
6. Write clear, self-documenting code

## License

Internal use only - Part of the Mobigen project.
