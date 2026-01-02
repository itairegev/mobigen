import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // TODO: Implement actual auth check with your backend
      // For now, simulating with a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate checking for stored session
      const storedUser = null; // await getStoredUser();

      setState({
        user: storedUser,
        isLoading: false,
        isAuthenticated: !!storedUser,
      });
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // TODO: Implement actual sign in with your backend
      // For now, simulating with a mock user
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
      };

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // TODO: Implement actual sign up with your backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user: User = {
        id: '1',
        email,
        name,
      };

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // TODO: Implement actual sign out with your backend
      await new Promise(resolve => setTimeout(resolve, 500));

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) throw new Error('No user logged in');

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // TODO: Implement actual profile update with your backend
      await new Promise(resolve => setTimeout(resolve, 500));

      setState(prev => ({
        ...prev,
        user: { ...prev.user!, ...updates },
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}
