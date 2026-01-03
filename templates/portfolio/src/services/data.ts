// Mock data for portfolio template

import type {
  Project,
  Skill,
  Experience,
  Education,
  Testimonial,
  Service,
  PersonalInfo,
  SocialLink,
  ContactMessage,
} from '@/types';

// Personal Information
export const PERSONAL_INFO: PersonalInfo = {
  name: 'Alex Rivera',
  title: 'Full-Stack Developer & Designer',
  tagline: 'Crafting beautiful digital experiences with code and creativity',
  bio: "I'm a passionate full-stack developer and designer with over 8 years of experience building web and mobile applications. I specialize in creating user-centered digital products that combine beautiful design with clean, maintainable code. When I'm not coding, you'll find me exploring new design trends, contributing to open source, or mentoring aspiring developers.",
  location: 'San Francisco, CA',
  email: 'alex.rivera@example.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  resume: 'https://example.com/resume.pdf',
  availability: 'available',
  hourlyRate: '$120/hour',
  socialLinks: [
    { id: '1', platform: 'github', url: 'https://github.com/alexrivera', username: 'alexrivera' },
    { id: '2', platform: 'linkedin', url: 'https://linkedin.com/in/alexrivera', username: 'alexrivera' },
    { id: '3', platform: 'twitter', url: 'https://twitter.com/alexrivera', username: '@alexrivera' },
    { id: '4', platform: 'dribbble', url: 'https://dribbble.com/alexrivera', username: 'alexrivera' },
    { id: '5', platform: 'website', url: 'https://alexrivera.dev' },
  ],
};

// Projects
export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'EcoMarket - Sustainable Shopping App',
    description: 'A mobile marketplace connecting eco-conscious consumers with sustainable brands. Features include product discovery, carbon footprint tracking, and community-driven reviews. Built with React Native, Node.js, and PostgreSQL.',
    shortDescription: 'Mobile marketplace for sustainable products',
    category: 'mobile',
    images: [
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
      'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
    tags: ['React Native', 'Node.js', 'PostgreSQL', 'UI/UX'],
    featured: true,
    client: 'EcoMarket Inc.',
    role: 'Lead Developer & Designer',
    year: 2024,
    url: 'https://ecomarket.app',
    achievements: [
      '50K+ downloads in first 3 months',
      '4.8★ average rating',
      'Featured in App Store sustainability category',
    ],
  },
  {
    id: '2',
    title: 'MindfulPath - Mental Wellness Platform',
    description: 'A comprehensive mental wellness platform offering guided meditations, mood tracking, and therapist connections. Features real-time video sessions, progress analytics, and personalized recommendations.',
    shortDescription: 'Mental wellness and meditation platform',
    category: 'web',
    images: [
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400',
    tags: ['React', 'TypeScript', 'WebRTC', 'Chart.js'],
    featured: true,
    client: 'MindfulPath',
    role: 'Full-Stack Developer',
    year: 2024,
    url: 'https://mindfulpath.com',
    repository: 'https://github.com/mindfulpath/web',
    achievements: [
      '10K+ active users',
      '95% user retention rate',
      'HIPAA compliant architecture',
    ],
  },
  {
    id: '3',
    title: 'Wanderlust Brand Identity',
    description: 'Complete brand identity design for a boutique travel agency. Includes logo design, brand guidelines, stationery, and marketing materials. Created a vibrant, adventurous aesthetic that captures the spirit of exploration.',
    shortDescription: 'Travel agency brand identity and design',
    category: 'branding',
    images: [
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
    tags: ['Branding', 'Logo Design', 'Figma', 'Illustration'],
    featured: true,
    client: 'Wanderlust Travel',
    role: 'Brand Designer',
    year: 2023,
    achievements: [
      '300% increase in brand recognition',
      'Featured in Design Milk',
    ],
  },
  {
    id: '4',
    title: 'FitTrack - Fitness Progress Dashboard',
    description: 'An analytics dashboard for fitness enthusiasts to track workouts, nutrition, and progress over time. Features interactive charts, goal setting, and social sharing capabilities.',
    shortDescription: 'Fitness tracking and analytics dashboard',
    category: 'web',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    tags: ['Vue.js', 'D3.js', 'Firebase', 'Tailwind CSS'],
    featured: false,
    role: 'Frontend Developer',
    year: 2023,
    repository: 'https://github.com/alexrivera/fittrack',
  },
  {
    id: '5',
    title: 'Urban Photography Collection',
    description: 'A curated collection of urban architecture and street photography from cities around the world. Captured the essence of modern city life through minimalist compositions and dramatic lighting.',
    shortDescription: 'Urban architecture photography series',
    category: 'photography',
    images: [
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
    tags: ['Photography', 'Urban', 'Architecture', 'Fine Art'],
    featured: false,
    role: 'Photographer',
    year: 2023,
    url: 'https://alexrivera.photography',
  },
  {
    id: '6',
    title: 'CodeCollab - Developer Collaboration Tool',
    description: 'A real-time code collaboration platform for remote development teams. Features live code editing, video chat, and integrated project management.',
    shortDescription: 'Real-time code collaboration platform',
    category: 'web',
    images: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
    tags: ['React', 'WebSocket', 'Monaco Editor', 'Express'],
    featured: false,
    role: 'Full-Stack Developer',
    year: 2022,
    repository: 'https://github.com/codecollab/app',
  },
  {
    id: '7',
    title: 'FoodieHub Mobile App',
    description: 'A social network for food enthusiasts to discover, review, and share restaurant experiences. Built with React Native and includes features like photo filters, location services, and social feeds.',
    shortDescription: 'Social network for food enthusiasts',
    category: 'mobile',
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    tags: ['React Native', 'Firebase', 'Google Maps API'],
    featured: false,
    role: 'Mobile Developer',
    year: 2022,
  },
  {
    id: '8',
    title: 'Character Design Illustrations',
    description: 'A series of character illustrations for a children\'s book publisher. Created vibrant, playful characters that bring stories to life with unique personalities and expressive poses.',
    shortDescription: 'Children\'s book character illustrations',
    category: 'illustration',
    images: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800',
      'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400',
    tags: ['Illustration', 'Character Design', 'Procreate', 'Digital Art'],
    featured: false,
    client: 'StoryTime Publishing',
    role: 'Illustrator',
    year: 2022,
  },
];

// Skills
export const MOCK_SKILLS: Skill[] = [
  // Development
  { id: '1', name: 'React', category: 'development', level: 'expert', yearsOfExperience: 6 },
  { id: '2', name: 'React Native', category: 'development', level: 'expert', yearsOfExperience: 5 },
  { id: '3', name: 'TypeScript', category: 'development', level: 'expert', yearsOfExperience: 5 },
  { id: '4', name: 'Node.js', category: 'development', level: 'advanced', yearsOfExperience: 6 },
  { id: '5', name: 'Python', category: 'development', level: 'advanced', yearsOfExperience: 4 },
  { id: '6', name: 'PostgreSQL', category: 'development', level: 'advanced', yearsOfExperience: 5 },
  { id: '7', name: 'GraphQL', category: 'development', level: 'advanced', yearsOfExperience: 3 },
  { id: '8', name: 'Vue.js', category: 'development', level: 'intermediate', yearsOfExperience: 3 },

  // Design
  { id: '9', name: 'Figma', category: 'design', level: 'expert', yearsOfExperience: 5 },
  { id: '10', name: 'UI/UX Design', category: 'design', level: 'expert', yearsOfExperience: 7 },
  { id: '11', name: 'Adobe Creative Suite', category: 'design', level: 'advanced', yearsOfExperience: 8 },
  { id: '12', name: 'Sketch', category: 'design', level: 'advanced', yearsOfExperience: 4 },
  { id: '13', name: 'Prototyping', category: 'design', level: 'expert', yearsOfExperience: 6 },

  // Tools
  { id: '14', name: 'Git', category: 'tools', level: 'expert', yearsOfExperience: 8 },
  { id: '15', name: 'Docker', category: 'tools', level: 'advanced', yearsOfExperience: 4 },
  { id: '16', name: 'AWS', category: 'tools', level: 'advanced', yearsOfExperience: 5 },
  { id: '17', name: 'CI/CD', category: 'tools', level: 'advanced', yearsOfExperience: 4 },

  // Soft Skills
  { id: '18', name: 'Team Leadership', category: 'soft-skills', level: 'expert' },
  { id: '19', name: 'Agile/Scrum', category: 'soft-skills', level: 'expert' },
  { id: '20', name: 'Client Communication', category: 'soft-skills', level: 'expert' },
  { id: '21', name: 'Problem Solving', category: 'soft-skills', level: 'expert' },
];

// Experience
export const MOCK_EXPERIENCE: Experience[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    company: 'TechVision Inc.',
    location: 'San Francisco, CA',
    type: 'full-time',
    startDate: '2021-03',
    current: true,
    description: 'Leading development of customer-facing web and mobile applications. Managing a team of 5 developers and collaborating with design and product teams.',
    achievements: [
      'Led migration to microservices architecture, improving system reliability by 40%',
      'Reduced API response times by 60% through optimization',
      'Mentored 3 junior developers to mid-level positions',
      'Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes',
    ],
    skills: ['React', 'React Native', 'Node.js', 'PostgreSQL', 'AWS', 'Team Leadership'],
  },
  {
    id: '2',
    title: 'Full-Stack Developer',
    company: 'Digital Innovations',
    location: 'San Francisco, CA',
    type: 'full-time',
    startDate: '2019-01',
    endDate: '2021-02',
    current: false,
    description: 'Developed and maintained multiple client-facing web applications. Collaborated with designers to create pixel-perfect implementations.',
    achievements: [
      'Built 12+ production applications serving 500K+ users',
      'Improved page load times by 50% through performance optimization',
      'Established frontend best practices and component library',
      'Achieved 95% code coverage through comprehensive testing',
    ],
    skills: ['React', 'Vue.js', 'TypeScript', 'GraphQL', 'Firebase'],
  },
  {
    id: '3',
    title: 'UI/UX Designer & Frontend Developer',
    company: 'Creative Studio Co.',
    location: 'Remote',
    type: 'freelance',
    startDate: '2018-06',
    endDate: '2020-12',
    current: false,
    description: 'Freelance designer and developer for various clients. Specialized in creating beautiful, user-friendly interfaces for startups and small businesses.',
    achievements: [
      'Completed 25+ projects for clients across 8 countries',
      'Maintained 5-star rating on Upwork with 100% client satisfaction',
      'Generated $150K+ in revenue',
      'Built long-term relationships with 10+ recurring clients',
    ],
    skills: ['Figma', 'React', 'UI/UX Design', 'Branding', 'Client Communication'],
  },
  {
    id: '4',
    title: 'Junior Developer',
    company: 'StartupXYZ',
    location: 'Oakland, CA',
    type: 'full-time',
    startDate: '2016-07',
    endDate: '2018-12',
    current: false,
    description: 'First professional development role. Worked on various features for the company\'s SaaS platform.',
    achievements: [
      'Contributed to 50+ feature releases',
      'Reduced bug count by 30% through improved testing practices',
      'Developed internal tools saving 10 hours/week for the team',
    ],
    skills: ['JavaScript', 'Python', 'Django', 'PostgreSQL'],
  },
];

// Education
export const MOCK_EDUCATION: Education[] = [
  {
    id: '1',
    degree: 'Bachelor of Science',
    field: 'Computer Science',
    institution: 'University of California, Berkeley',
    location: 'Berkeley, CA',
    startYear: 2012,
    endYear: 2016,
    gpa: '3.8',
    honors: ['Dean\'s List', 'Magna Cum Laude', 'CS Honor Society'],
  },
  {
    id: '2',
    degree: 'Certificate',
    field: 'UI/UX Design',
    institution: 'General Assembly',
    location: 'San Francisco, CA',
    startYear: 2017,
    endYear: 2017,
  },
];

// Testimonials
export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    position: 'CEO',
    company: 'EcoMarket Inc.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    quote: 'Alex transformed our vision into a beautiful, functional app that exceeded all expectations. Their attention to detail and commitment to quality is unmatched. Highly recommended!',
    rating: 5,
    projectId: '1',
    date: '2024-01',
  },
  {
    id: '2',
    name: 'Michael Chen',
    position: 'CTO',
    company: 'MindfulPath',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    quote: 'Working with Alex was a game-changer for our platform. They delivered a robust, scalable solution that handles our growing user base with ease. True professional.',
    rating: 5,
    projectId: '2',
    date: '2024-02',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    position: 'Founder',
    company: 'Wanderlust Travel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    quote: 'Alex created a stunning brand identity that perfectly captures our spirit of adventure. The entire process was smooth, collaborative, and the results speak for themselves.',
    rating: 5,
    projectId: '3',
    date: '2023-11',
  },
  {
    id: '4',
    name: 'David Park',
    position: 'Product Manager',
    company: 'TechVision Inc.',
    quote: 'As a colleague, Alex consistently delivers high-quality work and brings innovative solutions to complex problems. A true asset to any team.',
    rating: 5,
    date: '2023-08',
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    position: 'Marketing Director',
    company: 'Digital Innovations',
    quote: 'Alex has an incredible ability to balance aesthetics with functionality. Every project they touch becomes better. Would hire again in a heartbeat!',
    rating: 5,
    date: '2023-05',
  },
];

// Services
export const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    title: 'Web Development',
    description: 'Custom web applications built with modern technologies. From landing pages to complex web platforms, I create fast, responsive, and user-friendly websites.',
    icon: 'Code2',
    features: [
      'React & Next.js development',
      'Responsive design',
      'API integration',
      'Performance optimization',
      'SEO optimization',
    ],
    pricing: {
      type: 'project',
      amount: 'Starting at $5,000',
      currency: 'USD',
    },
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Native-quality mobile apps for iOS and Android using React Native. One codebase, two platforms, exceptional user experience.',
    icon: 'Smartphone',
    features: [
      'Cross-platform development',
      'Native performance',
      'App Store optimization',
      'Push notifications',
      'Offline functionality',
    ],
    pricing: {
      type: 'project',
      amount: 'Starting at $8,000',
      currency: 'USD',
    },
  },
  {
    id: '3',
    title: 'UI/UX Design',
    description: 'Beautiful, intuitive interfaces that users love. From wireframes to high-fidelity prototypes, I design with both aesthetics and usability in mind.',
    icon: 'Palette',
    features: [
      'User research & personas',
      'Wireframing & prototyping',
      'Visual design',
      'Usability testing',
      'Design systems',
    ],
    pricing: {
      type: 'project',
      amount: 'Starting at $3,000',
      currency: 'USD',
    },
  },
  {
    id: '4',
    title: 'Brand Identity',
    description: 'Complete brand identity packages including logo design, brand guidelines, and marketing materials. Create a memorable brand that stands out.',
    icon: 'Sparkles',
    features: [
      'Logo design',
      'Brand guidelines',
      'Color palette & typography',
      'Business cards & stationery',
      'Social media assets',
    ],
    pricing: {
      type: 'project',
      amount: 'Starting at $2,500',
      currency: 'USD',
    },
  },
  {
    id: '5',
    title: 'Consulting',
    description: 'Technical consulting and code reviews for development teams. Get expert guidance on architecture, performance, and best practices.',
    icon: 'MessageSquare',
    features: [
      'Technical architecture review',
      'Code review & optimization',
      'Team mentoring',
      'Technology selection',
      'Best practices implementation',
    ],
    pricing: {
      type: 'hourly',
      amount: '$120/hour',
      currency: 'USD',
    },
  },
];

// API simulation functions
export async function getProjects(featured?: boolean): Promise<Project[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (featured !== undefined) {
    return MOCK_PROJECTS.filter((p) => p.featured === featured);
  }
  return MOCK_PROJECTS;
}

export async function getProjectById(id: string): Promise<Project | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_PROJECTS.find((p) => p.id === id) || null;
}

export async function getSkills(): Promise<Skill[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_SKILLS;
}

export async function getExperience(): Promise<Experience[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_EXPERIENCE;
}

export async function getEducation(): Promise<Education[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_EDUCATION;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_TESTIMONIALS;
}

export async function getServices(): Promise<Service[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_SERVICES;
}

export async function getPersonalInfo(): Promise<PersonalInfo> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return PERSONAL_INFO;
}

export async function submitContactMessage(message: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<ContactMessage> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    ...message,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    status: 'new',
  };
}
