## Template: service-booking

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Scissors, Calendar...
- **AppointmentCardWithData** (src/app/(tabs)/appointments.tsx)
  - Hooks: useAppointments, useService, useStaffMember
  - JSX: SafeAreaView, ScrollView, View, ActivityIndicator, Text...
- **Scissors** (src/app/(tabs)/index.tsx)
  - Hooks: useServices, useCategories
  - JSX: SafeAreaView, ScrollView, View, Text, Sparkles...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - JSX: SafeAreaView, ScrollView, View, Image, Text...
- **ServicesScreen** (src/app/(tabs)/services.tsx)
  - Hooks: useState, useServices, useCategories
  - JSX: SafeAreaView, View, ScrollView, TouchableOpacity, Text...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **AppointmentDetailScreen** (src/app/appointments/[id].tsx)
  - Hooks: useLocalSearchParams, useAppointment, useService, useStaffMember, useCancelAppointment
  - JSX: SafeAreaView, ActivityIndicator, Text, View, TouchableOpacity...
- **ConfirmBookingScreen** (src/app/book/confirm.tsx)
  - Hooks: useBooking, useService, useStaffMember, useCreateAppointment
  - JSX: SafeAreaView, Text, View, TouchableOpacity, ChevronLeft...
- **SelectDateTimeScreen** (src/app/book/datetime.tsx)
  - Hooks: useBooking, useState, useAvailableSlots
  - JSX: SafeAreaView, Text, View, TouchableOpacity, ChevronLeft...
- **SelectStaffScreen** (src/app/book/staff.tsx)
  - Hooks: useBooking, useStaffForService
  - JSX: SafeAreaView, Text, View, TouchableOpacity, ChevronLeft...
- **ServiceDetailScreen** (src/app/services/[id].tsx)
  - Hooks: useLocalSearchParams, useService, useStaffForService, useBooking
  - JSX: SafeAreaView, ActivityIndicator, Text, View, TouchableOpacity...

### Components (7)
- **AppointmentCard**: 0 hooks, 6 elements
- **BookingSummary**: 0 hooks, 7 elements
- **CalendarPicker**: 1 hooks, 5 elements
- **ServiceCard**: 0 hooks, 6 elements
- **StaffCard**: 0 hooks, 6 elements
- **TimeSlotGrid**: 0 hooks, 4 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useAppointments**: deps [useQuery, useQueryClient, useMutation]
- **useBooking**: deps []
- **useServices**: deps [useQuery]
- **useStaff**: deps [useQuery]
- **useTheme**: deps [useColorScheme]

### Services (3)
- **appointments**: generateTimeSlots(), getAppointments(async), getAppointmentById(async), getAvailableSlots(async), createAppointment(async), cancelAppointment(async)
- **services**: getServices(async), getServiceById(async), getCategories(async), getCategoryById(async)
- **staff**: getAllStaff(async), getStaffById(async), getStaffForService(async)

### Navigation (expo-router)
- appointments -> Appointments
- index -> Index
- profile -> Profile
- services -> Services
- [id] -> [id]
- confirm -> Confirm
- datetime -> Datetime
- staff -> Staff
- [id] -> [id]

### Types (7)
- interface Service
- interface ServiceCategory
- interface Staff
- interface TimeSlot
- interface Appointment
- interface BookingState
- interface Review