import type { Article } from './index';

export type RootStackParamList = {
  '(tabs)': undefined;
  'article/[id]': { id: string; article?: Article };
  'search': { query?: string };
  'modal': undefined;
  '+not-found': undefined;
};

export type TabsParamList = {
  index: undefined;
  discover: undefined;
  bookmarks: undefined;
  profile: undefined;
};

export type HomeStackParamList = {
  index: undefined;
};

export type DiscoverStackParamList = {
  discover: undefined;
};

export type BookmarksStackParamList = {
  bookmarks: undefined;
};

export type ProfileStackParamList = {
  profile: undefined;
};

// Navigation prop types for screens
export interface HomeScreenProps {
  navigation: any; // Replace with proper navigation type from expo-router
  route: any;
}

export interface ArticleScreenProps {
  navigation: any;
  route: {
    params: {
      id: string;
      article?: Article;
    };
  };
}

export interface SearchScreenProps {
  navigation: any;
  route: {
    params: {
      query?: string;
    };
  };
}

// Common navigation actions
export interface NavigationActions {
  goBack: () => void;
  navigate: (screen: string, params?: any) => void;
  reset: (state: any) => void;
  push: (screen: string, params?: any) => void;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}