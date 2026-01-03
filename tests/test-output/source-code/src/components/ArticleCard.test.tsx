import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ArticleCard } from './ArticleCard';
import type { Article } from '@/types';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the BookmarkButton component
jest.mock('./BookmarkButton', () => ({
  BookmarkButton: ({ articleId, testID }: any) => {
    const { Text } = require('react-native');
    return <Text testID={testID || `bookmark-${articleId}`}>BookmarkButton</Text>;
  },
}));

const mockArticle: Article = {
  id: '1',
  title: 'Test Article',
  summary: 'This is a test article summary',
  image: 'https://example.com/image.jpg',
  category: {
    id: '1',
    name: 'Technology',
    slug: 'technology',
    icon: '💻',
    color: '#2563eb'
  },
  author: {
    id: '1',
    name: 'Test Author',
    avatar: 'https://example.com/avatar.jpg'
  },
  publishedAt: '2 hours ago',
  readTime: 5,
};

describe('ArticleCard', () => {
  it('renders article information correctly', () => {
    render(<ArticleCard article={mockArticle} testID="test-article" />);
    
    expect(screen.getByText('Test Article')).toBeTruthy();
    expect(screen.getByText('This is a test article summary')).toBeTruthy();
    expect(screen.getByText('Technology')).toBeTruthy();
    expect(screen.getByText('Test Author · 2 hours ago')).toBeTruthy();
    expect(screen.getByText('5 min read')).toBeTruthy();
  });

  it('renders in compact mode', () => {
    render(<ArticleCard article={mockArticle} compact testID="compact-article" />);
    
    expect(screen.getByText('Test Article')).toBeTruthy();
    expect(screen.getByText('2 hours ago · 5 min read')).toBeTruthy();
  });
});