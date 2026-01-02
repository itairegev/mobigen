import { Service } from '@/types';

export const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Wellness Checkup',
    description: 'Comprehensive health examination for your pet',
    type: 'veterinary',
    duration: 30,
    price: 65,
    availableFor: ['dog', 'cat', 'rabbit', 'hamster'],
    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400',
  },
  {
    id: '2',
    name: 'Vaccination',
    description: 'Core and non-core vaccinations for disease prevention',
    type: 'veterinary',
    duration: 20,
    price: 45,
    availableFor: ['dog', 'cat', 'rabbit'],
    image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400',
  },
  {
    id: '3',
    name: 'Dental Cleaning',
    description: 'Professional teeth cleaning and oral health check',
    type: 'veterinary',
    duration: 60,
    price: 150,
    availableFor: ['dog', 'cat'],
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
  },
  {
    id: '4',
    name: 'Full Grooming',
    description: 'Bath, haircut, nail trim, and ear cleaning',
    type: 'grooming',
    duration: 90,
    price: 75,
    availableFor: ['dog', 'cat', 'rabbit'],
    image: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400',
  },
  {
    id: '5',
    name: 'Bath & Brush',
    description: 'Refreshing bath with premium shampoo and thorough brushing',
    type: 'grooming',
    duration: 45,
    price: 40,
    availableFor: ['dog', 'cat'],
    image: 'https://images.unsplash.com/photo-1616593109013-71c8c0b5e33a?w=400',
  },
  {
    id: '6',
    name: 'Nail Trim',
    description: 'Quick and stress-free nail trimming service',
    type: 'grooming',
    duration: 15,
    price: 20,
    availableFor: ['dog', 'cat', 'rabbit', 'bird'],
    image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400',
  },
  {
    id: '7',
    name: 'Day Boarding',
    description: 'Safe and fun daycare for your pet while you are away',
    type: 'boarding',
    duration: 480,
    price: 35,
    availableFor: ['dog', 'cat'],
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
  },
  {
    id: '8',
    name: 'Overnight Boarding',
    description: '24-hour care with comfortable accommodations',
    type: 'boarding',
    duration: 1440,
    price: 55,
    availableFor: ['dog', 'cat', 'bird', 'rabbit'],
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
  },
  {
    id: '9',
    name: 'Basic Training',
    description: 'Essential obedience training (sit, stay, come)',
    type: 'training',
    duration: 60,
    price: 80,
    availableFor: ['dog'],
    image: 'https://images.unsplash.com/photo-1601758177266-bc599de87707?w=400',
  },
  {
    id: '10',
    name: 'Puppy Socialization',
    description: 'Group classes for puppies to learn social skills',
    type: 'training',
    duration: 90,
    price: 50,
    availableFor: ['dog'],
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
  },
];

export async function getServices(type?: Service['type']): Promise<Service[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  let services = [...MOCK_SERVICES];
  if (type) {
    services = services.filter(s => s.type === type);
  }
  return services;
}

export async function getServiceById(id: string): Promise<Service | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_SERVICES.find(service => service.id === id) || null;
}

export async function getServicesForPet(petSpecies: string): Promise<Service[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_SERVICES.filter(service =>
    service.availableFor.includes(petSpecies as any)
  );
}
