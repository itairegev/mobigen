# School/Classroom Template

A comprehensive student portal mobile app for managing assignments, grades, schedules, and school communications.

## Features

### 📚 Assignment Management
- View all assignments across subjects
- Filter by status (pending, in-progress, submitted, graded)
- Detailed assignment view with due dates, instructions, and attachments
- Submit assignments and view feedback

### 📊 Grades & Progress
- Overall GPA tracking
- Subject-wise grade breakdown
- Grade trends and performance analytics
- Detailed feedback from teachers

### 📅 Academic Calendar
- Interactive month view calendar
- Daily class schedule
- Assignment deadlines
- School events and holidays
- Exam schedules

### 📢 Announcements
- School-wide and class-specific announcements
- Priority-based notifications
- Category filtering (academic, events, deadlines, emergency)
- Read/unread tracking

### 👤 Student Profile
- Personal information and student ID
- Attendance statistics
- Course enrollment
- Academic performance overview

### 💬 Messages (Coming Soon)
- Direct messaging with teachers
- Parent-teacher communication
- Group discussions

### 📎 Study Resources (Coming Soon)
- Course materials and study guides
- Video lectures
- Assignment templates
- Helpful links

## Color Scheme

Educational green and blue palette:

- **Primary Green**: `#10b981` - Represents growth and learning
- **Secondary Blue**: `#3b82f6` - Academic and professional
- **Subject Colors**: Custom colors for each subject for visual categorization

## Screens

### Tab Navigation
1. **Home** - Dashboard with upcoming assignments, announcements, and quick stats
2. **Homework** - All assignments with filtering and sorting
3. **Grades** - GPA and subject grades with detailed breakdown
4. **Calendar** - Schedule and events
5. **Profile** - Student information and settings

### Detail Screens
- **Assignment Detail** (`/homework/[id]`) - Full assignment information
- **Announcements** (`/announcements`) - All school announcements
- **Resources** (`/resources`) - Study materials and resources
- **Messages** (`/messages`) - Teacher and parent communications

## Mock Data

The template includes realistic mock data:

- **6 Subjects** with teachers, rooms, and current grades
- **10 Assignments** across different subjects and types (homework, quiz, test, project)
- **8 Announcements** with varying priorities and categories
- **12 Grades** with feedback and performance tracking
- **15+ Calendar Events** including classes, deadlines, and school events

## Key Components

- `AnnouncementCard` - Displays announcements with priority indicators
- `AssignmentCard` - Shows assignment summary with status badges
- `GradeItem` - Displays individual grade with subject and feedback
- `SubjectGradeSummaryCard` - Subject overview with trend indicators
- `CalendarView` - Interactive month calendar with event indicators

## Custom Hooks

- `useAssignments` - Fetch and filter assignments
- `useGrades` - Grade data and GPA calculations
- `useAnnouncements` - School announcements
- `useCalendar` - Calendar events and schedule
- `useSubjects` - Subject information

## Testing

E2E tests included:
- `view-homework.yaml` - Navigate and view assignments
- `check-grades.yaml` - View grades and GPA

## Customization Ideas

1. **Branding**
   - Update colors in `src/theme/colors.ts`
   - Replace subject colors to match school identity
   - Customize app name and icon in `app.json`

2. **Features to Add**
   - Homework submission with file uploads
   - Real-time messaging with teachers
   - Push notifications for deadlines
   - Offline mode for viewing assignments
   - Parent portal access
   - Grade predictions and GPA calculators

3. **Backend Integration**
   - Connect to school's existing student information system
   - Real-time grade updates
   - Assignment submission workflow
   - Attendance tracking
   - Report card generation

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Production Deployment

1. Update bundle IDs in `app.json`
2. Configure EAS build
3. Set up backend API endpoints
4. Configure push notifications
5. Submit to app stores

## License

MIT
