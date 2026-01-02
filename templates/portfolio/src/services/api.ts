// API service for portfolio app
// In production, this would connect to a real backend

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.example.com') {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    // Simulated API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error('API not implemented - using mock data');
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // Simulated API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    throw new Error('API not implemented - using mock data');
  }
}

export const api = new ApiClient();
