import { useQuery } from '@tanstack/react-query';
import type { Category } from '@/types';

const mockCategories: Category[] = [
  { 
    id: '1', 
    name: 'AI & Machine Learning', 
    slug: 'ai-ml', 
    icon: '🤖', 
    color: '#2563eb', 
    isActive: true, 
    sortOrder: 1, 
    createdAt: new Date().toISOString(),
    description: 'Latest in artificial intelligence and machine learning'
  },
  { 
    id: '2', 
    name: 'Mobile Development', 
    slug: 'mobile', 
    icon: '📱', 
    color: '#059669', 
    isActive: true, 
    sortOrder: 2, 
    createdAt: new Date().toISOString(),
    description: 'Mobile app development news and trends'
  },
  { 
    id: '3', 
    name: 'Web Development', 
    slug: 'web-dev', 
    icon: '🌐', 
    color: '#7c3aed', 
    isActive: true, 
    sortOrder: 3, 
    createdAt: new Date().toISOString(),
    description: 'Web technologies and frameworks'
  },
  { 
    id: '4', 
    name: 'Startups', 
    slug: 'startups', 
    icon: '🚀', 
    color: '#dc2626', 
    isActive: true, 
    sortOrder: 4, 
    createdAt: new Date().toISOString(),
    description: 'Startup news and entrepreneurship'
  },
  { 
    id: '5', 
    name: 'Cybersecurity', 
    slug: 'cybersecurity', 
    icon: '🔒', 
    color: '#ea580c', 
    isActive: true, 
    sortOrder: 5, 
    createdAt: new Date().toISOString(),
    description: 'Security news and best practices'
  },
  { 
    id: '6', 
    name: 'Cloud & DevOps', 
    slug: 'cloud-devops', 
    icon: '☁️', 
    color: '#0891b2', 
    isActive: true, 
    sortOrder: 6, 
    createdAt: new Date().toISOString(),
    description: 'Cloud computing and DevOps practices'
  },
  { 
    id: '7', 
    name: 'Hardware & IoT', 
    slug: 'hardware-iot', 
    icon: '💾', 
    color: '#9333ea', 
    isActive: true, 
    sortOrder: 7, 
    createdAt: new Date().toISOString(),
    description: 'Hardware innovations and Internet of Things'
  },
  { 
    id: '8', 
    name: 'Open Source', 
    slug: 'open-source', 
    icon: '🛠️', 
    color: '#059669', 
    isActive: true, 
    sortOrder: 8, 
    createdAt: new Date().toISOString(),
    description: 'Open source projects and community'
  },
];

async function fetchCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCategories;
}

export function useCategories() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return {
    categories: data || [],
    isLoading,
    error,
  };
}
