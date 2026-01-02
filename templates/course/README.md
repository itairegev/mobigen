# Course/Learning Platform Template

A complete course and learning platform mobile app built with React Native and Expo. Perfect for educators, coaches, influencers, and corporate trainers who want to own their platform.

## Features

- **Course Catalog**: Browse and search courses by category
- **Video Lessons**: Watch lessons with progress tracking
- **Quizzes**: Test knowledge with multiple-choice quizzes
- **Progress Tracking**: Track completion and earn certificates
- **Notes**: Take timestamped notes during lessons
- **Downloadable Resources**: Access lesson materials

## Screens

### Tabs
- **Home**: Enrolled courses, continue learning
- **Courses**: Browse all available courses with category filters
- **Progress**: View learning statistics and certificates
- **Profile**: User settings and preferences

### Detail Screens
- **Course Detail**: Course info, instructor, lessons list
- **Lesson Player**: Video player with notes and resources
- **Quiz**: Interactive quiz with instant feedback

## Tech Stack

- React Native + Expo SDK 52
- TypeScript
- NativeWind (Tailwind CSS)
- Expo Router (file-based routing)
- TanStack Query (data fetching)
- Zustand (state management)
- Expo AV (video playback)

## Mock Data

The template includes realistic mock data:
- 4 courses across different categories
- 20 lessons total with video URLs
- 2 quizzes with multiple questions
- Progress tracking with local persistence

## Quick Start

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

## Customization

### Branding
Edit `src/theme/colors.ts` to customize the color scheme:
- Primary: Indigo (#6366f1)
- Secondary: Purple (#8b5cf6)

### Content
Replace mock data in `src/services/courses.ts` with your actual course content.

### Video Player
The template uses placeholder videos. Replace with your actual video URLs in the lesson data.

## E2E Tests

Maestro test flows included:
- `browse-courses.yaml`: Browse and filter courses
- `start-lesson.yaml`: Complete a lesson
- `take-quiz.yaml`: Take and pass a quiz

Run tests:
```bash
maestro test .maestro/
```

## White-Label Ready

- Unique bundle ID: `com.mobigen.course`
- Customizable app name and branding
- Educational indigo/purple color scheme
- Certificate generation for completed courses

## Target Users

- **Coaches & Educators**: Sell courses without platform fees
- **Corporate Trainers**: Employee training and onboarding
- **Content Creators**: Monetize expertise directly
- **Influencers**: Build exclusive learning communities

## License

MIT License - Build unlimited apps with this template.
