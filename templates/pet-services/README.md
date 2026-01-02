# Pet Services Template

A complete mobile app template for veterinary clinics, pet groomers, pet boarding, and pet care businesses built with React Native + Expo.

## Features

### Core Functionality
- **Pet Management**: Add and manage multiple pets with profiles (photos, breed, age, weight)
- **Appointments**: Book and track veterinary, grooming, boarding, and training appointments
- **Health Records**: Store vaccination records, checkups, surgeries, and medications
- **Reminders**: Get notified about upcoming vaccinations, medications, and appointments
- **Pet Shop**: Browse and purchase pet products (food, toys, accessories, medicine)
- **Pet Care Articles**: Access expert tips and advice for pet health and wellness

### Included Services
1. **Veterinary** - Wellness checkups, vaccinations, dental cleaning
2. **Grooming** - Full grooming, bath & brush, nail trim
3. **Boarding** - Day boarding, overnight boarding
4. **Training** - Basic obedience, puppy socialization

### Screens
- Home: Overview with pets, reminders, and upcoming appointments
- My Pets: List of all pets
- Pet Detail: View pet profile, health records, and appointments
- Add Pet: Form to add a new pet
- Appointments: View all appointments (upcoming and past)
- Book Appointment: Multi-step booking flow
- Shop: Browse pet products by category
- Articles: Pet care tips and advice
- Profile: User settings and account management

### Technical Stack
- **Framework**: React Native + Expo SDK 52
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: Zustand (pets) + TanStack Query (data fetching)
- **Icons**: Lucide React Native
- **Date Handling**: date-fns

### Theme
- **Primary Color**: Orange (#f97316) - Friendly and warm
- **Secondary Color**: Teal (#14b8a6) - Calm and trustworthy
- **Design**: Clean, pet-friendly interface with emoji accents

### Mock Data
- 3 sample pets (Max the dog, Luna the cat, Charlie the bird)
- 10 services across all categories
- 5 appointments (upcoming and completed)
- 5 reminders (vaccinations, medications, checkups)
- 6 health records
- 5 pet care articles
- 8 pet products

### E2E Tests
- `view-pets.yaml` - Navigate pets list and view pet details
- `book-appointment.yaml` - Complete booking flow (pet selection + service selection)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Customization Points

### Colors
Edit `src/theme/colors.ts` to customize the color scheme.

### Services
Modify `src/services/services.ts` to add/edit services offered.

### Pet Species
Update species options in `src/types/index.ts` and `src/app/pets/add.tsx`.

### Products
Customize products in `src/services/products.ts`.

### Articles
Edit articles in `src/services/articles.ts`.

## White-Label Configuration

When generating apps from this template, Mobigen automatically customizes:
- App name and bundle ID
- Brand colors (primary/secondary)
- Logo and splash screen
- Service offerings
- Backend database schema

## Backend Integration

This template uses mock data for demonstration. In production, connect to:
- **AWS DynamoDB** for pet records, appointments, reminders
- **S3** for pet photos and document storage
- **API Gateway** for REST endpoints
- **Push notifications** for appointment reminders

## Database Schema

### Tables
- `pets` - Pet profiles
- `appointments` - Scheduled appointments
- `health_records` - Medical history
- `reminders` - Upcoming tasks
- `products` - Shop inventory
- `orders` - Purchase history

## License

Copyright © 2024 Mobigen. All rights reserved.
