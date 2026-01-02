## Template: portfolio

### Screens (9)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Home, Briefcase, User...
- **AboutScreen** (src/app/(tabs)/about.tsx)
  - Hooks: useTheme
  - JSX: SafeAreaView, ScrollView, View, Image, Text...
- **ContactScreen** (src/app/(tabs)/contact.tsx)
  - Hooks: useTheme
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useTheme, useFeaturedProjects, useTestimonials
  - JSX: SafeAreaView, ScrollView, View, Image, Text...
- **PortfolioScreen** (src/app/(tabs)/portfolio.tsx)
  - Hooks: useTheme, useState, useProjects
  - JSX: SafeAreaView, ScrollView, View, Text, TouchableOpacity...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: QueryClientProvider, Stack, Stack.Screen
- **ProjectDetailScreen** (src/app/projects/[id].tsx)
  - Hooks: useTheme, useLocalSearchParams, useProject
  - JSX: SafeAreaView, View, Text, Link, TouchableOpacity...
- **ServicesScreen** (src/app/services.tsx)
  - Hooks: useTheme
  - JSX: IconComponent, SafeAreaView, ScrollView, View, Text...
- **TestimonialsScreen** (src/app/testimonials.tsx)
  - Hooks: useTheme, useTestimonials
  - JSX: SafeAreaView, ScrollView, View, Text, TestimonialCard

### Components (8)
- **ContactForm**: 3 hooks, 6 elements
- **ExperienceItem**: 1 hooks, 3 elements
- **ImageGallery**: 2 hooks, 6 elements
- **ProjectCard**: 1 hooks, 5 elements
- **SkillBadge**: 1 hooks, 2 elements
- **SocialLinks**: 1 hooks, 6 elements
- **TestimonialCard**: 1 hooks, 4 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **useContact**: deps [useState, useMutation]
- **useProjects**: deps [useQuery, useProjects]
- **useTestimonials**: deps [useQuery]
- **useTheme**: deps [useColorScheme]

### Services (1)
- **data**: getProjects(async), getProjectById(async), getSkills(async), getExperience(async), getEducation(async), getTestimonials(async), getServices(async), getPersonalInfo(async), submitContactMessage(async)

### Navigation (expo-router)
- about -> About
- contact -> Contact
- index -> Index
- portfolio -> Portfolio
- [id] -> [id]
- services -> Services
- testimonials -> Testimonials

### Types (11)
- interface Project
- type ProjectCategory
- interface Skill
- type SkillCategory
- interface Experience
- interface Education
- interface Testimonial
- interface Service
- interface ContactMessage
- interface SocialLink
- interface PersonalInfo