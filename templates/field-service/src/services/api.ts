// API client (mock for now, can be replaced with real backend)

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error(`GET ${endpoint} - Backend not implemented yet`);
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error(`POST ${endpoint} - Backend not implemented yet`);
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error(`PUT ${endpoint} - Backend not implemented yet`);
  },

  async delete<T>(endpoint: string): Promise<T> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error(`DELETE ${endpoint} - Backend not implemented yet`);
  },
};
