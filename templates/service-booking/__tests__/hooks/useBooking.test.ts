/**
 * Tests for useBooking hook (Zustand store)
 */

import { act } from '@testing-library/react-hooks';

// Mock zustand
jest.mock('zustand', () => ({
  create: jest.fn((createState) => {
    let state = createState(
      (newState: any) => {
        state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
      },
      () => state,
      {} as any
    );

    const useStore = (selector?: (s: typeof state) => any) => {
      return selector ? selector(state) : state;
    };

    useStore.getState = () => state;
    useStore.setState = (newState: any) => {
      state = typeof newState === 'function' ? newState(state) : { ...state, ...newState };
    };

    return useStore;
  }),
}));

// Import after mocks
import { useBooking } from '../../src/hooks/useBooking';

describe('useBooking', () => {
  beforeEach(() => {
    // Reset booking state before each test
    useBooking.setState({
      serviceId: null,
      staffId: null,
      date: null,
      timeSlot: null,
      notes: '',
    });
  });

  const mockTimeSlot = {
    id: 'slot-1',
    time: '10:00 AM',
    available: true,
  };

  describe('setService', () => {
    it('should set service ID', () => {
      const { setService } = useBooking.getState();

      act(() => {
        setService('service-1');
      });

      expect(useBooking.getState().serviceId).toBe('service-1');
    });
  });

  describe('setStaff', () => {
    it('should set staff ID', () => {
      const { setStaff } = useBooking.getState();

      act(() => {
        setStaff('staff-1');
      });

      expect(useBooking.getState().staffId).toBe('staff-1');
    });
  });

  describe('setDate', () => {
    it('should set date', () => {
      const { setDate } = useBooking.getState();

      act(() => {
        setDate('2024-03-15');
      });

      expect(useBooking.getState().date).toBe('2024-03-15');
    });
  });

  describe('setTimeSlot', () => {
    it('should set time slot', () => {
      const { setTimeSlot } = useBooking.getState();

      act(() => {
        setTimeSlot(mockTimeSlot);
      });

      expect(useBooking.getState().timeSlot).toEqual(mockTimeSlot);
    });
  });

  describe('setNotes', () => {
    it('should set notes', () => {
      const { setNotes } = useBooking.getState();

      act(() => {
        setNotes('Please be gentle');
      });

      expect(useBooking.getState().notes).toBe('Please be gentle');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { setService, setStaff, setDate, setTimeSlot, setNotes, reset } = useBooking.getState();

      act(() => {
        setService('service-1');
        setStaff('staff-1');
        setDate('2024-03-15');
        setTimeSlot(mockTimeSlot);
        setNotes('Some notes');
      });

      expect(useBooking.getState().serviceId).toBe('service-1');

      act(() => {
        reset();
      });

      const state = useBooking.getState();
      expect(state.serviceId).toBeNull();
      expect(state.staffId).toBeNull();
      expect(state.date).toBeNull();
      expect(state.timeSlot).toBeNull();
      expect(state.notes).toBe('');
    });
  });

  describe('canProceedToStaff', () => {
    it('should return false when service is not selected', () => {
      const { canProceedToStaff } = useBooking.getState();
      expect(canProceedToStaff()).toBe(false);
    });

    it('should return true when service is selected', () => {
      const { setService, canProceedToStaff } = useBooking.getState();

      act(() => {
        setService('service-1');
      });

      expect(useBooking.getState().canProceedToStaff()).toBe(true);
    });
  });

  describe('canProceedToDateTime', () => {
    it('should return false when neither service nor staff is selected', () => {
      const { canProceedToDateTime } = useBooking.getState();
      expect(canProceedToDateTime()).toBe(false);
    });

    it('should return false when only service is selected', () => {
      const { setService, canProceedToDateTime } = useBooking.getState();

      act(() => {
        setService('service-1');
      });

      expect(useBooking.getState().canProceedToDateTime()).toBe(false);
    });

    it('should return true when both service and staff are selected', () => {
      const { setService, setStaff, canProceedToDateTime } = useBooking.getState();

      act(() => {
        setService('service-1');
        setStaff('staff-1');
      });

      expect(useBooking.getState().canProceedToDateTime()).toBe(true);
    });
  });

  describe('canProceedToConfirm', () => {
    it('should return false when booking is incomplete', () => {
      const { canProceedToConfirm } = useBooking.getState();
      expect(canProceedToConfirm()).toBe(false);
    });

    it('should return false when time slot is missing', () => {
      const { setService, setStaff, setDate, canProceedToConfirm } = useBooking.getState();

      act(() => {
        setService('service-1');
        setStaff('staff-1');
        setDate('2024-03-15');
      });

      expect(useBooking.getState().canProceedToConfirm()).toBe(false);
    });

    it('should return true when all required fields are filled', () => {
      const { setService, setStaff, setDate, setTimeSlot, canProceedToConfirm } = useBooking.getState();

      act(() => {
        setService('service-1');
        setStaff('staff-1');
        setDate('2024-03-15');
        setTimeSlot(mockTimeSlot);
      });

      expect(useBooking.getState().canProceedToConfirm()).toBe(true);
    });

    it('should return true even without notes (notes are optional)', () => {
      const { setService, setStaff, setDate, setTimeSlot, canProceedToConfirm } = useBooking.getState();

      act(() => {
        setService('service-1');
        setStaff('staff-1');
        setDate('2024-03-15');
        setTimeSlot(mockTimeSlot);
        // Don't set notes
      });

      expect(useBooking.getState().canProceedToConfirm()).toBe(true);
    });
  });

  describe('booking flow', () => {
    it('should track complete booking flow', () => {
      const {
        setService,
        setStaff,
        setDate,
        setTimeSlot,
        setNotes,
        canProceedToStaff,
        canProceedToDateTime,
        canProceedToConfirm,
      } = useBooking.getState();

      // Initial state - can't proceed anywhere
      expect(canProceedToStaff()).toBe(false);
      expect(canProceedToDateTime()).toBe(false);
      expect(canProceedToConfirm()).toBe(false);

      // Step 1: Select service
      act(() => {
        setService('haircut-1');
      });

      let state = useBooking.getState();
      expect(state.canProceedToStaff()).toBe(true);
      expect(state.canProceedToDateTime()).toBe(false);

      // Step 2: Select staff
      act(() => {
        setStaff('john-doe');
      });

      state = useBooking.getState();
      expect(state.canProceedToDateTime()).toBe(true);
      expect(state.canProceedToConfirm()).toBe(false);

      // Step 3: Select date
      act(() => {
        setDate('2024-03-20');
      });

      state = useBooking.getState();
      expect(state.canProceedToConfirm()).toBe(false);

      // Step 4: Select time slot
      act(() => {
        setTimeSlot({ id: 'slot-2', time: '2:00 PM', available: true });
      });

      state = useBooking.getState();
      expect(state.canProceedToConfirm()).toBe(true);

      // Optional: Add notes
      act(() => {
        setNotes('First time customer');
      });

      state = useBooking.getState();
      expect(state.notes).toBe('First time customer');
      expect(state.canProceedToConfirm()).toBe(true);
    });
  });
});
