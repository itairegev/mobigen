// Portfolio template configuration for Mobigen

export const templateConfig = {
  id: 'portfolio',
  name: 'Portfolio & Resume',
  description: 'Professional portfolio app to showcase work, skills, and experience. Perfect for designers, developers, and creative professionals.',
  category: 'niche',

  // Features for AI context
  features: [
    'project-showcase',
    'image-gallery',
    'skills-display',
    'work-experience',
    'education-timeline',
    'client-testimonials',
    'contact-form',
    'social-links',
    'services-listing',
    'category-filtering',
    'availability-status',
  ],

  // Screens list for validation
  screens: [
    { name: 'Home', path: '(tabs)/index' },
    { name: 'Portfolio', path: '(tabs)/portfolio' },
    { name: 'About', path: '(tabs)/about' },
    { name: 'Contact', path: '(tabs)/contact' },
    { name: 'Project Detail', path: 'projects/[id]' },
    { name: 'Services', path: 'services' },
    { name: 'Testimonials', path: 'testimonials' },
  ],

  // Components list
  components: [
    'ProjectCard',
    'ImageGallery',
    'SkillBadge',
    'TestimonialCard',
    'ContactForm',
    'SocialLinks',
    'ExperienceItem',
  ],

  // Mock data requirements
  mockData: {
    projects: 8,
    testimonials: 5,
    skills: 20,
    experience: 4,
    education: 2,
    services: 5,
  },

  // Backend tables needed (for future integration)
  backendTables: [
    'projects',
    'testimonials',
    'skills',
    'experience',
    'education',
    'services',
    'contact_messages',
  ],

  // E2E test flows
  testFlows: [
    'view-projects',
    'contact-form',
  ],

  // Color theme
  theme: {
    primary: '#6366f1', // Indigo
    accent: '#f59e0b', // Amber
    background: '#0f172a', // Dark slate
    surface: '#1e293b',
  },

  // Target users
  targetUsers: [
    'freelancers',
    'designers',
    'developers',
    'photographers',
    'illustrators',
    'consultants',
    'creative-professionals',
  ],

  // Key differentiators
  keyFeatures: [
    'Professional dark theme optimized for portfolios',
    'Fullscreen image gallery for showcasing work',
    'Comprehensive about section with skills and experience',
    'Built-in contact form with validation',
    'Category-based project filtering',
    'Client testimonials with ratings',
    'Service offerings with pricing',
    'Social media integration',
  ],
};

export default templateConfig;
