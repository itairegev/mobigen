import { Service, ServiceCategory } from '@/types';

export const MOCK_CATEGORIES: ServiceCategory[] = [
  {
    id: '1',
    name: 'Hair Services',
    description: 'Cuts, styling, and treatments',
    icon: 'Scissors',
    sortOrder: 1,
  },
  {
    id: '2',
    name: 'Spa & Massage',
    description: 'Relaxation and wellness',
    icon: 'Sparkles',
    sortOrder: 2,
  },
  {
    id: '3',
    name: 'Beauty & Nails',
    description: 'Manicures and skincare',
    icon: 'Palette',
    sortOrder: 3,
  },
  {
    id: '4',
    name: 'Body Treatments',
    description: 'Full body care',
    icon: 'Heart',
    sortOrder: 4,
  },
];

export const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Women\'s Haircut',
    description: 'Professional haircut with wash and style. Consultation included to ensure your desired look.',
    duration: 60,
    price: 65,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    categoryId: '1',
    staffIds: ['1', '2', '3'],
    available: true,
  },
  {
    id: '2',
    name: 'Men\'s Haircut',
    description: 'Classic men\'s cut with clipper or scissor work. Includes wash and basic styling.',
    duration: 45,
    price: 45,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
    categoryId: '1',
    staffIds: ['1', '4'],
    available: true,
  },
  {
    id: '3',
    name: 'Balayage Highlights',
    description: 'Hand-painted highlights for a natural, sun-kissed look. Includes toner and styling.',
    duration: 180,
    price: 180,
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400',
    categoryId: '1',
    staffIds: ['2', '3'],
    available: true,
  },
  {
    id: '4',
    name: 'Deep Tissue Massage',
    description: '60-minute therapeutic massage targeting muscle tension and knots.',
    duration: 60,
    price: 95,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    categoryId: '2',
    staffIds: ['5', '6'],
    available: true,
  },
  {
    id: '5',
    name: 'Swedish Massage',
    description: 'Relaxing full-body massage with gentle, flowing strokes. Perfect for stress relief.',
    duration: 90,
    price: 110,
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400',
    categoryId: '2',
    staffIds: ['5', '6'],
    available: true,
  },
  {
    id: '6',
    name: 'Facial Treatment',
    description: 'Customized facial with cleansing, exfoliation, mask, and moisturizer.',
    duration: 75,
    price: 85,
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
    categoryId: '3',
    staffIds: ['2', '3'],
    available: true,
  },
  {
    id: '7',
    name: 'Gel Manicure',
    description: 'Long-lasting gel polish manicure with nail shaping and cuticle care.',
    duration: 45,
    price: 55,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
    categoryId: '3',
    staffIds: ['3'],
    available: true,
  },
  {
    id: '8',
    name: 'Body Scrub & Wrap',
    description: 'Exfoliating scrub followed by hydrating body wrap. Leaves skin soft and smooth.',
    duration: 90,
    price: 120,
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400',
    categoryId: '4',
    staffIds: ['5', '6'],
    available: true,
  },
];

// Simulated API with delay
export async function getServices(categoryId?: string): Promise<Service[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let services = [...MOCK_SERVICES];
  if (categoryId) {
    services = services.filter((service) => service.categoryId === categoryId);
  }
  return services;
}

export async function getServiceById(id: string): Promise<Service | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_SERVICES.find((service) => service.id === id) || null;
}

export async function getCategories(): Promise<ServiceCategory[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  return MOCK_CATEGORIES;
}

export async function getCategoryById(id: string): Promise<ServiceCategory | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  return MOCK_CATEGORIES.find((category) => category.id === id) || null;
}
