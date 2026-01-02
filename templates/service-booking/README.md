# Service Booking Template

A complete service booking application built with React Native and Expo. Perfect for salons, spas, clinics, consultants, and any service-based business.

## Features

- **Service Catalog**: Browse services by category with detailed information
- **Staff Selection**: Choose your preferred service provider
- **Calendar Booking**: Interactive calendar with available time slots
- **Appointment Management**: View, manage, and cancel appointments
- **Real-time Availability**: See which time slots are available
- **Booking Flow**: Guided 3-step booking process (Staff → Date/Time → Confirm)
- **User Profile**: Manage account and preferences

## Screens

### Tab Navigation
- **Home**: Quick overview with featured services and categories
- **Services**: Full service catalog with category filtering
- **Appointments**: View upcoming and past appointments
- **Profile**: User account management

### Booking Flow
1. **Service Detail**: View service information and available staff
2. **Select Staff**: Choose your preferred staff member
3. **Select Date & Time**: Pick appointment date and time slot
4. **Confirm Booking**: Review and confirm appointment

### Additional Screens
- **Appointment Detail**: View full appointment information with cancel option

## Template Structure

```
service-booking/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── index.tsx      # Home
│   │   │   ├── services.tsx   # Service catalog
│   │   │   ├── appointments.tsx
│   │   │   └── profile.tsx
│   │   ├── services/[id].tsx  # Service detail
│   │   ├── book/              # Booking flow
│   │   │   ├── staff.tsx
│   │   │   ├── datetime.tsx
│   │   │   └── confirm.tsx
│   │   └── appointments/[id].tsx
│   │
│   ├── components/            # Reusable components
│   │   ├── ServiceCard.tsx
│   │   ├── StaffCard.tsx
│   │   ├── CalendarPicker.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   ├── AppointmentCard.tsx
│   │   └── BookingSummary.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useServices.ts
│   │   ├── useStaff.ts
│   │   ├── useAppointments.ts
│   │   └── useBooking.ts      # Zustand store for booking state
│   │
│   ├── services/              # Mock data & API
│   │   ├── services.ts        # 8 services across 4 categories
│   │   ├── staff.ts           # 6 staff members
│   │   └── appointments.ts    # Appointment management
│   │
│   └── types/                 # TypeScript definitions
│       └── index.ts
│
└── .maestro/                  # E2E tests
    ├── browse-services.yaml
    ├── select-staff.yaml
    ├── book-slot.yaml
    └── view-appointments.yaml
```

## Mock Data

### Services (8)
- Women's Haircut ($65, 60min)
- Men's Haircut ($45, 45min)
- Balayage Highlights ($180, 180min)
- Deep Tissue Massage ($95, 60min)
- Swedish Massage ($110, 90min)
- Facial Treatment ($85, 75min)
- Gel Manicure ($55, 45min)
- Body Scrub & Wrap ($120, 90min)

### Categories (4)
- Hair Services
- Spa & Massage
- Beauty & Nails
- Body Treatments

### Staff (6)
- Sarah Johnson - Master Stylist (4.9 rating)
- Emily Chen - Senior Colorist (4.8 rating)
- Jessica Martinez - Beauty Specialist (5.0 rating)
- Michael Brown - Barber (4.7 rating)
- Rachel Thompson - Licensed Massage Therapist (4.9 rating)
- David Lee - Spa Therapist (4.8 rating)

## Technology Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand (booking flow state)
- **Data Fetching**: TanStack Query (React Query)
- **Date Handling**: date-fns
- **Icons**: Lucide React Native
- **Testing**: Maestro (E2E tests)

## Color Theme

**Primary (Teal)**: Calm, professional, spa-like
- Primary: #0d9488 (teal-600)
- Lighter shades for backgrounds and accents

**Secondary (Purple)**: Premium, luxury feel
- Secondary: #9333ea (purple-600)
- Used for highlights and special elements

## Key Features Implementation

### Booking State Management (Zustand)
The booking flow uses Zustand for managing multi-step state:
- Service selection
- Staff selection
- Date and time slot selection
- Additional notes
- Validation for each step

### Calendar & Time Slot System
- Interactive month view with date selection
- Disabled past dates
- Real-time availability checking
- Time slots generated based on staff schedules
- Visual indication of booked/unavailable slots

### Appointment Management
- View upcoming and past appointments
- Detailed appointment information
- Cancel appointments (upcoming only)
- Automatic status updates

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Testing

Run E2E tests with Maestro:

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all tests
maestro test .maestro/

# Run specific test
maestro test .maestro/book-slot.yaml
```

## Customization

### Adding New Services
Edit `src/services/services.ts`:
```typescript
export const MOCK_SERVICES: Service[] = [
  {
    id: '9',
    name: 'Your New Service',
    description: 'Service description',
    duration: 60,
    price: 75,
    categoryId: '1',
    staffIds: ['1', '2'],
    available: true,
  },
  // ... existing services
];
```

### Adding New Staff
Edit `src/services/staff.ts`:
```typescript
export const MOCK_STAFF: Staff[] = [
  {
    id: '7',
    name: 'Your Staff Member',
    title: 'Position Title',
    avatar: 'https://i.pravatar.cc/150?img=20',
    bio: 'Bio description',
    rating: 4.9,
    reviewCount: 50,
    serviceIds: ['1', '2'],
    available: true,
  },
  // ... existing staff
];
```

### Changing Theme Colors
Edit `tailwind.config.js` to update the primary and secondary color palettes.

## White-Label Configuration

This template is designed for easy white-labeling:
- Bundle ID: `com.mobigen.servicebooking`
- App Name: ServiceBooking
- Primary Color: Teal (#0d9488)
- All configurable via `app.json` and `tailwind.config.js`

## Backend Integration

The template uses mock data services. To integrate with a real backend:

1. Replace mock functions in `src/services/` with API calls
2. Update hooks to handle loading and error states
3. Implement authentication
4. Add payment processing
5. Set up push notifications for appointment reminders

## License

MIT License - Free for commercial and personal use.
