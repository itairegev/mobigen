import { create } from 'zustand';
import { Pet } from '@/types';
import { getPets } from '@/services';

interface PetStore {
  pets: Pet[];
  selectedPetId: string | null;
  loading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  selectPet: (petId: string | null) => void;
  getSelectedPet: () => Pet | null;
}

export const usePets = create<PetStore>((set, get) => ({
  pets: [],
  selectedPetId: null,
  loading: false,
  error: null,

  fetchPets: async () => {
    set({ loading: true, error: null });
    try {
      const pets = await getPets();
      set({ pets, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch pets', loading: false });
    }
  },

  selectPet: (petId) => {
    set({ selectedPetId: petId });
  },

  getSelectedPet: () => {
    const { pets, selectedPetId } = get();
    return pets.find(p => p.id === selectedPetId) || null;
  },
}));
