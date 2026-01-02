import { Staff } from '@/types';

export const MOCK_STAFF: Staff[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'Master Stylist',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'Over 15 years of experience in hair cutting and styling. Specialized in modern cuts and color techniques.',
    rating: 4.9,
    reviewCount: 127,
    serviceIds: ['1', '2'],
    available: true,
  },
  {
    id: '2',
    name: 'Emily Chen',
    title: 'Senior Colorist',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Passionate about creating beautiful color transformations. Expert in balayage and ombre techniques.',
    rating: 4.8,
    reviewCount: 98,
    serviceIds: ['1', '3', '6'],
    available: true,
  },
  {
    id: '3',
    name: 'Jessica Martinez',
    title: 'Beauty Specialist',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: 'Certified esthetician specializing in skincare and nail services. Making people feel beautiful inside and out.',
    rating: 5.0,
    reviewCount: 145,
    serviceIds: ['1', '3', '6', '7'],
    available: true,
  },
  {
    id: '4',
    name: 'Michael Brown',
    title: 'Barber',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Traditional barbering with a modern twist. Specializing in fades, beard trims, and classic cuts.',
    rating: 4.7,
    reviewCount: 83,
    serviceIds: ['2'],
    available: true,
  },
  {
    id: '5',
    name: 'Rachel Thompson',
    title: 'Licensed Massage Therapist',
    avatar: 'https://i.pravatar.cc/150?img=16',
    bio: 'Certified in deep tissue and Swedish massage. Focused on healing and relaxation.',
    rating: 4.9,
    reviewCount: 156,
    serviceIds: ['4', '5', '8'],
    available: true,
  },
  {
    id: '6',
    name: 'David Lee',
    title: 'Spa Therapist',
    avatar: 'https://i.pravatar.cc/150?img=13',
    bio: 'Holistic approach to wellness through massage and body treatments. 10+ years experience.',
    rating: 4.8,
    reviewCount: 112,
    serviceIds: ['4', '5', '8'],
    available: true,
  },
];

// Simulated API with delay
export async function getAllStaff(): Promise<Staff[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return MOCK_STAFF;
}

export async function getStaffById(id: string): Promise<Staff | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return MOCK_STAFF.find((staff) => staff.id === id) || null;
}

export async function getStaffForService(serviceId: string): Promise<Staff[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return MOCK_STAFF.filter((staff) => staff.serviceIds.includes(serviceId));
}
