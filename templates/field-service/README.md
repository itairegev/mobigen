# Field Service & Jobs Template

A complete mobile app for field service professionals, contractors, and technicians to manage jobs, track time, and communicate with clients.

## Features

### Job Management
- **Daily Schedule**: View today's jobs at a glance
- **Job List**: Browse all jobs with status filters
- **Job Details**: Complete information including client, location, and schedule
- **Status Updates**: Update job status (Scheduled, En Route, In Progress, On Hold, Completed, Cancelled)
- **Priority Levels**: Track job priority (Low, Normal, High, Urgent)

### Time Tracking
- **Clock In/Out**: Track time spent on each job
- **Time Log**: View time entries by date
- **Statistics**: Daily, weekly, and monthly hour tracking
- **Auto-calculation**: Automatic duration calculation

### Client Communication
- **Messages**: Client messaging interface
- **Contact Info**: Quick access to client phone and email
- **Job-linked Conversations**: Messages tied to specific jobs

### Photo Documentation
- **Camera Integration**: Take photos directly from the app
- **Gallery Upload**: Upload photos from device gallery
- **Photo Types**: Before, during, after, issue, completion
- **Job Photos**: Organize photos by job

### Location & Navigation
- **Map Integration**: View job site location on map
- **Get Directions**: One-tap navigation to job site
- **Access Instructions**: View gate codes, parking info, etc.

### Performance Stats
- **Today's Stats**: Jobs completed, in progress, scheduled
- **Weekly Stats**: Total jobs and hours worked
- **Monthly Stats**: Revenue tracking and job completion rates

## Screens

### Tab Navigation
1. **Home** - Dashboard with today's schedule and stats
2. **Jobs** - All jobs with status filtering
3. **Time Log** - Time tracking history
4. **Messages** - Client communications
5. **Profile** - User settings and account

### Detail Screens
- **Job Detail** - Complete job information with actions
- **Update Status** - Change job status
- **Job Photos** - Document work with photos

## Mock Data

The template includes realistic mock data:
- **10 Jobs** - Various statuses, priorities, and types (HVAC, plumbing, electrical, etc.)
- **5 Clients** - Residential and commercial clients
- **3 Time Entries** - Sample time tracking data
- **3 Conversations** - Client message threads

## Technology

- **React Native + Expo** - Cross-platform mobile framework
- **Expo Router** - File-based navigation
- **NativeWind** - Tailwind CSS for React Native
- **Zustand** - State management for jobs and time tracking
- **Expo Image Picker** - Camera and gallery access
- **Expo Location** - Location services for maps
- **TypeScript** - Type safety
- **Date-fns** - Date/time formatting

## Color Theme

Professional blue/gray palette suitable for field service work:
- Primary: Blue (#3b82f6)
- Gray scale for backgrounds and text
- Status colors: Green (completed), Blue (in progress), Orange (en route), Red (urgent)

## E2E Tests

Maestro test flows included:
1. **view-jobs.yaml** - Navigate and view jobs
2. **update-status.yaml** - Change job status
3. **clock-time.yaml** - Clock in/out time tracking

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

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Customization Ideas

- Add customer signature capture for job completion
- Integrate with scheduling/dispatch systems
- Add parts inventory tracking
- Invoice generation and payment collection
- Route optimization for multiple jobs
- Offline mode for areas with poor connectivity
- Team collaboration features
- Equipment maintenance tracking
- Custom forms and checklists

## Use Cases

Perfect for:
- HVAC technicians
- Plumbers
- Electricians
- Appliance repair
- Home maintenance services
- Commercial maintenance
- Security system installers
- Network/IT field services
- General contractors
- Any field service business

## License

MIT License - Built with Mobigen
