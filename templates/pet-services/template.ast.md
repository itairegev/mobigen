## Template: pet-services

### Screens (11)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, PawPrint, Calendar...
- **AppointmentsScreen** (src/app/(tabs)/appointments.tsx)
  - Hooks: useRouter, usePets, useAppointments, useEffect
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, usePets, useUpcomingAppointments, useUpcomingReminders, useEffect
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **PetsScreen** (src/app/(tabs)/pets.tsx)
  - Hooks: useRouter, usePets, useEffect
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **ShopScreen** (src/app/(tabs)/shop.tsx)
  - Hooks: useState, useQuery
  - JSX: SafeAreaView, View, ScrollView, TouchableOpacity, Text...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, SafeAreaProvider, Stack, Stack.Screen
- **ArticlesScreen** (src/app/articles.tsx)
  - Hooks: useState, useQuery
  - JSX: SafeAreaView, View, Text, ScrollView, TouchableOpacity...
- **BookAppointmentScreen** (src/app/book.tsx)
  - Hooks: useRouter, usePets, useState, useEffect, useQuery
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **PetDetailScreen** (src/app/pets/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useQuery
  - JSX: SafeAreaView, Text, ScrollView, View, Image...
- **AddPetScreen** (src/app/pets/add.tsx)
  - Hooks: useRouter, useState
  - JSX: SafeAreaView, ScrollView, View, Text, TextInput...

### Components (7)
- **AppointmentCard**: 0 hooks, 5 elements
- **ArticleCard**: 0 hooks, 5 elements
- **HealthRecord**: 0 hooks, 4 elements
- **PetCard**: 0 hooks, 4 elements
- **ReminderItem**: 0 hooks, 5 elements
- **ServiceSelector**: 0 hooks, 4 elements
- **index**: 0 hooks, 0 elements

### Hooks (5)
- **useAppointments**: deps [useQuery]
- **usePets**: deps []
- **useRecords**: deps [useQuery]
- **useReminders**: deps [useQuery]
- **useTheme**: deps [useColorScheme]

### Services (7)
- **appointments**: getAppointments(async), getUpcomingAppointments(async), getAppointmentById(async), bookAppointment(async), cancelAppointment(async)
- **articles**: getArticles(async), getArticleById(async)
- **pets**: getPets(async), getPetById(async), addPet(async), updatePet(async), deletePet(async)
- **products**: getProducts(async), getProductById(async)
- **records**: getHealthRecords(async), addHealthRecord(async)
- **reminders**: getReminders(async), getUpcomingReminders(async), completeReminder(async), addReminder(async)
- **services**: getServices(async), getServiceById(async), getServicesForPet(async)

### Navigation (expo-router)
- appointments -> Appointments
- index -> Index
- pets -> Pets
- profile -> Profile
- shop -> Shop
- articles -> Articles
- book -> Book
- [id] -> [id]
- add -> Add

### Types (13)
- type PetSpecies
- type AppointmentStatus
- type ServiceType
- type ReminderType
- interface Pet
- interface Service
- interface Appointment
- interface HealthRecord
- interface Reminder
- interface Article
- interface PetProduct
- interface CartItem
- interface Cart