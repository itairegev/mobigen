// Mock API service - replace with real backend integration
export const api = {
  baseURL: 'https://api.example.com',

  async get(endpoint: string) {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: null };
  },

  async post(endpoint: string, data: any) {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: null };
  },

  async put(endpoint: string, data: any) {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: null };
  },

  async delete(endpoint: string) {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { data: null };
  },
};
