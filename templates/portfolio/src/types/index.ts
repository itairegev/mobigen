// Portfolio Types

export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: ProjectCategory;
  images: string[];
  thumbnail: string;
  tags: string[];
  featured: boolean;
  client?: string;
  role: string;
  year: number;
  url?: string;
  repository?: string;
  achievements?: string[];
}

export type ProjectCategory =
  | 'web'
  | 'mobile'
  | 'design'
  | 'branding'
  | 'photography'
  | 'illustration';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export type SkillCategory =
  | 'design'
  | 'development'
  | 'tools'
  | 'soft-skills';

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'freelance' | 'contract';
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM or null if current
  current: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  startYear: number;
  endYear?: number;
  gpa?: string;
  honors?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  position: string;
  company: string;
  avatar?: string;
  quote: string;
  rating: number;
  projectId?: string;
  date: string; // YYYY-MM
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  features: string[];
  pricing?: {
    type: 'fixed' | 'hourly' | 'project';
    amount?: string;
    currency?: string;
  };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: Date;
  status: 'new' | 'read' | 'replied';
}

export interface SocialLink {
  id: string;
  platform: 'github' | 'linkedin' | 'twitter' | 'dribbble' | 'behance' | 'instagram' | 'website';
  url: string;
  username?: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  phone?: string;
  avatar: string;
  resume?: string; // URL to resume PDF
  availability: 'available' | 'busy' | 'unavailable';
  hourlyRate?: string;
  socialLinks: SocialLink[];
}
