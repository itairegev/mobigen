import { Pet } from '@/types';

export const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 30,
    gender: 'male',
    photo: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400',
    microchipId: 'GB123456789',
    notes: 'Friendly and energetic. Loves to play fetch.',
    ownerId: 'user-1',
    createdAt: new Date('2022-01-15'),
  },
  {
    id: '2',
    name: 'Luna',
    species: 'cat',
    breed: 'British Shorthair',
    age: 2,
    weight: 4.5,
    gender: 'female',
    photo: 'https://images.unsplash.com/photo-1573865526739-10c1de0c06f7?w=400',
    microchipId: 'GB987654321',
    notes: 'Calm and affectionate. Prefers quiet environments.',
    ownerId: 'user-1',
    createdAt: new Date('2022-06-20'),
  },
  {
    id: '3',
    name: 'Charlie',
    species: 'bird',
    breed: 'Cockatiel',
    age: 1,
    weight: 0.1,
    gender: 'male',
    photo: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400',
    notes: 'Loves to sing and whistle. Very social.',
    ownerId: 'user-1',
    createdAt: new Date('2023-03-10'),
  },
];

export async function getPets(): Promise<Pet[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_PETS];
}

export async function getPetById(id: string): Promise<Pet | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_PETS.find(pet => pet.id === id) || null;
}

export async function addPet(pet: Omit<Pet, 'id' | 'createdAt'>): Promise<Pet> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newPet: Pet = {
    ...pet,
    id: String(Date.now()),
    createdAt: new Date(),
  };
  return newPet;
}

export async function updatePet(id: string, updates: Partial<Pet>): Promise<Pet> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const pet = MOCK_PETS.find(p => p.id === id);
  if (!pet) throw new Error('Pet not found');
  return { ...pet, ...updates };
}

export async function deletePet(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
}
