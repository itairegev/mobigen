export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'reptile' | 'other';

export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export type ServiceType = 'veterinary' | 'grooming' | 'boarding' | 'training' | 'daycare';

export type ReminderType = 'vaccination' | 'medication' | 'checkup' | 'grooming';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: number; // in years
  weight: number; // in kg
  gender: 'male' | 'female';
  photo?: string;
  microchipId?: string;
  notes?: string;
  ownerId: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  type: ServiceType;
  duration: number; // minutes
  price: number;
  availableFor: PetSpecies[];
  image?: string;
}

export interface Appointment {
  id: string;
  petId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  veterinarian?: string;
  createdAt: Date;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'vaccination' | 'checkup' | 'surgery' | 'medication' | 'other';
  title: string;
  description: string;
  date: Date;
  veterinarian?: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
}

export interface Reminder {
  id: string;
  petId: string;
  type: ReminderType;
  title: string;
  dueDate: Date;
  completed: boolean;
  notes?: string;
  createdAt: Date;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  publishedAt: Date;
  readTime: number; // minutes
  tags: string[];
}

export interface PetProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'toys' | 'accessories' | 'medicine' | 'grooming';
  image: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}
