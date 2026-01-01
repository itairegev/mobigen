# News Template

News reader React Native template for Mobigen.

## Overview

The news template provides a complete news reading experience with article feeds, category filtering, bookmarks, and personalization features.

## Features

- Article feed with pagination
- Category navigation
- Article detail view
- Bookmarks/saved articles
- Search functionality
- Reading history
- Share articles
- Text size adjustment
- Offline reading
- Push notifications

## Structure

```
news/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Feed
│   │   ├── discover.tsx     # Categories
│   │   ├── bookmarks.tsx    # Saved articles
│   │   └── profile.tsx      # Settings
│   ├── article/
│   │   └── [id].tsx         # Article detail
│   ├── category/
│   │   └── [slug].tsx       # Category feed
│   ├── search/
│   │   └── index.tsx        # Search
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── articles/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleList.tsx
│   │   ├── ArticleContent.tsx
│   │   └── ArticleHeader.tsx
│   ├── categories/
│   │   ├── CategoryChip.tsx
│   │   ├── CategoryGrid.tsx
│   │   └── CategoryHeader.tsx
│   ├── reader/
│   │   ├── ReaderView.tsx
│   │   ├── ReaderSettings.tsx
│   │   └── ShareButton.tsx
│   └── ui/
│       └── ...
├── hooks/
│   ├── useArticles.ts
│   ├── useCategories.ts
│   ├── useBookmarks.ts
│   └── useReaderSettings.ts
├── services/
│   ├── api.ts
│   ├── articles.ts
│   └── bookmarks.ts
├── types/
│   ├── article.ts
│   └── category.ts
└── ...
```

## Screens

### Feed

- Latest articles
- Trending section
- Personalized recommendations
- Pull to refresh

### Article Detail

- Article header
- Content with images
- Related articles
- Comments section
- Share options

### Discover

- Category grid
- Featured categories
- Following topics

### Bookmarks

- Saved articles
- Reading history
- Offline content

## Data Types

### Article

```typescript
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: Author;
  category: Category;
  image: string;
  publishedAt: Date;
  readTime: number;
  tags: string[];
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  articleCount: number;
}
```

### Author

```typescript
interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}
```

## Hooks

### useArticles

```typescript
const {
  articles,
  loading,
  error,
  loadMore,
  refresh,
  hasMore
} = useArticles({ category: 'technology' });

// Load more articles
await loadMore();

// Refresh feed
await refresh();
```

### useBookmarks

```typescript
const { bookmarks, add, remove, isBookmarked } = useBookmarks();

// Check if bookmarked
const saved = isBookmarked(articleId);

// Toggle bookmark
saved ? remove(articleId) : add(article);
```

### useReaderSettings

```typescript
const { fontSize, theme, setFontSize, setTheme } = useReaderSettings();

// Adjust text size
setFontSize('large');

// Set reader theme
setTheme('sepia');
```

## Components

### ArticleCard

```tsx
<ArticleCard
  article={article}
  variant="featured"
  onPress={() => navigate(`/article/${article.id}`)}
  onBookmark={() => toggleBookmark(article)}
/>
```

### ArticleContent

```tsx
<ArticleContent
  content={article.content}
  fontSize={fontSize}
  theme={theme}
/>
```

### CategoryChip

```tsx
<CategoryChip
  category={category}
  selected={selected}
  onPress={() => setCategory(category.slug)}
/>
```

## Reader Features

### Text Size Options

| Size | Font Size | Line Height |
|------|-----------|-------------|
| Small | 14px | 1.4 |
| Medium | 16px | 1.5 |
| Large | 18px | 1.6 |
| Extra Large | 20px | 1.7 |

### Reader Themes

| Theme | Background | Text |
|-------|------------|------|
| Light | #FFFFFF | #000000 |
| Dark | #1A1A1A | #FFFFFF |
| Sepia | #F4ECD8 | #5B4636 |

## Offline Support

Articles can be saved for offline reading:

```typescript
// Save article for offline
await saveOffline(article);

// Get offline articles
const offlineArticles = await getOfflineArticles();

// Check if available offline
const isOffline = await isAvailableOffline(articleId);
```

## Search

Full-text search across articles:

```typescript
const { results, search, loading } = useSearch();

// Search articles
await search('climate change');

// Results include title, summary matches
results.map(r => ({
  article: r.article,
  highlights: r.highlights,
}));
```

## Use Cases

- News apps
- Magazine apps
- Blog readers
- Content aggregators
- Educational content
- Documentation apps

## Related Templates

- [base](../base/) - Minimal starter
- [ai-assistant](../ai-assistant/) - Add AI features
