# Fitness & Gym Template

A complete fitness and gym management app built with React Native + Expo.

## Features

### 🏋️ Class Scheduling
- Browse fitness classes by category (yoga, HIIT, strength, cardio, pilates, spin, CrossFit)
- Filter by difficulty level (beginner, intermediate, advanced)
- View instructor profiles and class capacity
- Book classes with real-time availability

### 💪 Workout Library
- Pre-built workout programs for all fitness levels
- 30+ exercises with detailed instructions
- Filter workouts by category (full-body, upper-body, lower-body, strength, cardio, flexibility)
- Exercise demonstrations with muscle group targeting

### 📊 Progress Tracking
- Workout streak tracking with visual indicators
- Weekly and monthly statistics
- Goal setting and progress monitoring
- Activity charts and analytics
- Calorie and time tracking

### 📝 Workout Logging
- Quick workout logging
- Track duration, calories, and notes
- Exercise set/rep/weight logging
- Custom workout creation

### 👤 User Profile
- Member profile management
- Membership status
- Contact information
- Settings and preferences

## Tech Stack

- **Framework**: React Native 0.76.5 + Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React Native
- **Date Handling**: date-fns

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── classes.tsx    # Class schedule
│   │   ├── workouts.tsx   # Workout library
│   │   ├── progress.tsx   # Progress tracking
│   │   └── profile.tsx    # User profile
│   ├── classes/[id].tsx   # Class detail
│   ├── workouts/[id].tsx  # Workout detail
│   ├── exercises/[id].tsx # Exercise detail
│   └── log-workout.tsx    # Log workout modal
├── components/            # Reusable components
│   ├── ClassCard.tsx
│   ├── WorkoutCard.tsx
│   ├── ExerciseItem.tsx
│   ├── SetLogger.tsx
│   ├── ProgressChart.tsx
│   ├── StatsCard.tsx
│   ├── StreakBadge.tsx
│   └── GoalProgress.tsx
├── hooks/                 # Custom hooks
│   ├── useClasses.ts
│   ├── useWorkouts.ts
│   ├── useExercises.ts
│   └── useProgress.ts
├── services/              # Mock data services
│   ├── classes.ts         # 10 fitness classes
│   ├── workouts.ts        # 8 workout programs
│   └── exercises.ts       # 30 exercises
├── types/                 # TypeScript definitions
│   └── index.ts
└── theme/                 # Theme configuration
    └── colors.ts          # Green/blue fitness theme
```

## Mock Data

### Classes (10)
- Morning Yoga Flow
- HIIT Burn
- Strength & Conditioning
- Spin Class
- Pilates Core
- CrossFit WOD
- Cardio Kickboxing
- Evening Yoga Restore
- Power Strength
- HIIT & Abs

### Workouts (8)
- Full Body Strength (60 min, intermediate)
- Upper Body Builder (50 min, advanced)
- Leg Day Destroyer (55 min, advanced)
- Beginner HIIT (25 min, beginner)
- Core & Abs Blast (30 min, intermediate)
- Cardio Endurance (40 min, intermediate)
- Mobility & Flexibility (35 min, beginner)
- Power & Explosiveness (45 min, advanced)

### Exercises (30)
Complete exercise database including:
- Compound movements (squats, deadlifts, bench press)
- Isolation exercises (bicep curls, leg curls)
- Cardio exercises (running, jumping jacks, burpees)
- Core exercises (planks, crunches, dead bugs)
- Flexibility exercises (downward dog, stretches)

## Color Theme

- **Primary Green**: #10b981 (Emerald)
- **Secondary Blue**: #3b82f6 (Blue)
- **Success**: #10b981
- **Warning**: #f59e0b
- **Error**: #ef4444

## E2E Tests

Maestro test flows included:

1. **browse-classes.yaml** - Filter and browse fitness classes
2. **book-class.yaml** - View class details and book
3. **log-workout.yaml** - Log a completed workout
4. **view-progress.yaml** - View stats and progress

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

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run E2E tests (requires Maestro CLI)
maestro test .maestro/
```

## Customization

This template is designed to be easily customizable:

- **Branding**: Update colors in `tailwind.config.js` and `src/theme/colors.ts`
- **Classes**: Modify mock data in `src/services/classes.ts`
- **Workouts**: Customize programs in `src/services/workouts.ts`
- **Exercises**: Add/edit exercises in `src/services/exercises.ts`
- **Features**: Add new screens in `src/app/`

## White-Label Ready

This template is ready for white-labeling:

- Configurable app name and bundle ID in `app.json`
- Customizable color scheme
- Modular component architecture
- Easy branding updates

## License

MIT
