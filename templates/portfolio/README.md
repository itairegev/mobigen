# Portfolio & Resume Template

A professional portfolio and resume mobile app built with React Native and Expo. Perfect for designers, developers, and creative professionals to showcase their work and skills.

## Features

### 🎨 Screens

- **Home**: Hero section with featured work and testimonials
- **Portfolio**: Full project gallery with category filtering
- **About**: Bio, skills, work experience, and education
- **Contact**: Contact form with social links and availability
- **Project Detail**: Detailed project view with image gallery
- **Services**: Professional services and pricing
- **Testimonials**: Client reviews and ratings

### 💼 Key Features

- Beautiful dark theme with indigo/amber accent colors
- Fully responsive image galleries with fullscreen view
- Category-based project filtering (mobile, web, design, etc.)
- Skill badges with proficiency levels
- Work experience timeline with achievements
- Contact form with validation
- Social media integration
- Professional service listings

### 📊 Data Included

- 8 sample projects across multiple categories
- 5 client testimonials with ratings
- 20+ skills organized by category
- 4 work experience entries
- 2 education records
- 5 professional services

## Project Structure

```
portfolio/
├── src/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── index.tsx          # Home screen
│   │   │   ├── portfolio.tsx      # Portfolio gallery
│   │   │   ├── about.tsx          # About/resume
│   │   │   ├── contact.tsx        # Contact form
│   │   │   └── _layout.tsx        # Tab navigation
│   │   ├── projects/[id].tsx      # Project detail
│   │   ├── services.tsx           # Services page
│   │   ├── testimonials.tsx       # All testimonials
│   │   └── _layout.tsx            # Root layout
│   │
│   ├── components/
│   │   ├── ProjectCard.tsx        # Project preview card
│   │   ├── ImageGallery.tsx       # Fullscreen image gallery
│   │   ├── SkillBadge.tsx         # Skill with level indicator
│   │   ├── TestimonialCard.tsx    # Client review card
│   │   ├── ContactForm.tsx        # Contact form with validation
│   │   ├── SocialLinks.tsx        # Social media icons
│   │   └── ExperienceItem.tsx     # Work experience card
│   │
│   ├── hooks/
│   │   ├── useProjects.ts         # Project data fetching
│   │   ├── useTestimonials.ts     # Testimonials fetching
│   │   ├── useContact.ts          # Contact form submission
│   │   └── useTheme.ts            # Theme colors hook
│   │
│   ├── services/
│   │   ├── data.ts                # Mock portfolio data
│   │   ├── api.ts                 # API client
│   │   └── storage.ts             # Local storage
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   │
│   └── theme/
│       └── colors.ts              # Color theme
│
├── .maestro/
│   ├── view-projects.yaml         # E2E: Browse projects
│   └── contact-form.yaml          # E2E: Submit contact form
│
└── app.json                       # Expo configuration
```

## Type Definitions

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  category: 'web' | 'mobile' | 'design' | 'branding' | 'photography' | 'illustration';
  images: string[];
  tags: string[];
  featured: boolean;
  role: string;
  year: number;
  url?: string;
  achievements?: string[];
}

interface Skill {
  name: string;
  category: 'development' | 'design' | 'tools' | 'soft-skills';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

interface Experience {
  title: string;
  company: string;
  type: 'full-time' | 'part-time' | 'freelance' | 'contract';
  startDate: string;
  endDate?: string;
  description: string;
  achievements: string[];
  skills: string[];
}

interface Testimonial {
  name: string;
  position: string;
  company: string;
  quote: string;
  rating: number;
}
```

## Customization Guide

### 1. Update Personal Information

Edit `src/services/data.ts`:

```typescript
export const PERSONAL_INFO: PersonalInfo = {
  name: 'Your Name',
  title: 'Your Title',
  tagline: 'Your tagline',
  bio: 'Your bio...',
  location: 'Your City',
  email: 'your@email.com',
  // ... update all fields
};
```

### 2. Add Your Projects

Update the `MOCK_PROJECTS` array in `src/services/data.ts`:

```typescript
export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Your Project',
    description: 'Project description...',
    category: 'web',
    images: ['https://...'],
    // ... add your project details
  },
];
```

### 3. Customize Colors

Edit `src/theme/colors.ts` and `tailwind.config.js`:

```typescript
// colors.ts
export const colors = {
  light: {
    primary: '#your-color',
    // ...
  },
};
```

### 4. Update Social Links

In `src/services/data.ts`:

```typescript
socialLinks: [
  { platform: 'github', url: 'https://github.com/yourusername' },
  { platform: 'linkedin', url: 'https://linkedin.com/in/yourprofile' },
  // ... add your links
];
```

## Running the App

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

## E2E Testing

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run tests
maestro test .maestro/view-projects.yaml
maestro test .maestro/contact-form.yaml
```

## Design System

### Colors

- **Primary**: Indigo (#6366f1) - Professional, trustworthy
- **Accent**: Amber (#f59e0b) - Warm, creative
- **Background**: Slate (dark mode optimized)

### Typography

- **Headings**: Bold, clear hierarchy
- **Body**: 16px base, 1.5-1.75 line height
- **Labels**: 14px, semi-bold

### Components

All components follow a consistent design language:
- Rounded corners (8-12px)
- Subtle shadows
- Clear touch targets (44px minimum)
- Accessible contrast ratios

## Production Deployment

### Update App Config

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your Portfolio",
    "slug": "your-portfolio",
    "ios": {
      "bundleIdentifier": "com.yourname.portfolio"
    },
    "android": {
      "package": "com.yourname.portfolio"
    }
  }
}
```

### Build for Production

```bash
# iOS
npm run build:ios

# Android
npm run build:android
```

## Backend Integration

To connect to a real backend:

1. Update `src/services/api.ts` with your API endpoint
2. Replace mock data functions in `src/services/data.ts`
3. Update hooks to use real API calls

Example:

```typescript
// services/api.ts
export async function getProjects(): Promise<Project[]> {
  const response = await fetch('https://api.yourbackend.com/projects');
  return response.json();
}
```

## License

MIT License - Feel free to use this template for your own portfolio!

## Support

For issues or questions, please open an issue on GitHub or contact the Mobigen team.

---

Built with ❤️ using [Mobigen](https://mobigen.io) - AI-powered mobile app generation
