# Mobigen Templates

React Native templates for AI-powered app generation.

## Overview

Mobigen templates are starter projects that provide the foundation for AI-generated mobile apps. Each template includes pre-built screens, components, and functionality tailored to specific use cases.

## Available Templates

| Template | Description | Key Features |
|----------|-------------|--------------|
| [base](./base/) | Minimal starter | Navigation, theme, core components |
| [ecommerce](./ecommerce/) | E-commerce app | Products, cart, checkout, orders |
| [loyalty](./loyalty/) | Loyalty program | Points, rewards, tiers, redemption |
| [news](./news/) | News reader | Articles, categories, bookmarks |
| [ai-assistant](./ai-assistant/) | AI chat app | Chat interface, history, settings |

## Tech Stack

All templates share a common tech stack:

- **Framework**: React Native (Expo SDK 51)
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **State**: React Context + Hooks
- **TypeScript**: Full type safety

## Template Structure

Each template follows a consistent structure:

```
templates/<name>/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation
│   │   ├── _layout.tsx    # Tab layout
│   │   ├── index.tsx      # Home tab
│   │   └── ...            # Other tabs
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   └── ...               # Feature components
├── hooks/                 # Custom React hooks
├── services/              # API and data services
├── theme/                 # Theme configuration
│   ├── colors.ts
│   ├── typography.ts
│   └── index.ts
├── utils/                 # Utility functions
├── types/                 # TypeScript types
├── app.json               # Expo configuration
├── tailwind.config.js     # Tailwind configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Using Templates

### For AI Generation

Templates are used by the Generator service to create projects:

```typescript
import { TemplateManager } from '@mobigen/storage';

const templates = new TemplateManager({
  templatesDir: '/app/templates',
  bareReposDir: '/app/templates-bare',
  projectsDir: '/app/projects',
});

// Clone template for new project
const projectPath = await templates.cloneForProject({
  templateId: 'ecommerce',
  projectId: 'project-123',
});

// Get template context for AI
const context = await templates.getContext('ecommerce');
```

### For Manual Development

Templates can also be used directly:

```bash
# Copy template
cp -r templates/base my-new-app
cd my-new-app

# Install dependencies
npm install

# Start development
npx expo start
```

## Template Features

### Common Features (All Templates)

- Expo Router navigation
- NativeWind styling
- Dark mode support
- TypeScript configuration
- ESLint + Prettier
- Custom fonts
- Loading states
- Error handling

### Base Template

Minimal starter with essential components:

- Tab navigation
- Home screen
- Settings screen
- Theme system

### E-commerce Template

Full e-commerce functionality:

- Product listings
- Product details
- Shopping cart
- Checkout flow
- Order history
- User profile

### Loyalty Template

Loyalty program features:

- Points balance
- Rewards catalog
- Tier system
- Redemption flow
- Transaction history
- Profile settings

### News Template

News reader functionality:

- Article feed
- Category filtering
- Article detail view
- Bookmarks
- Search
- User preferences

### AI Assistant Template

AI chat interface:

- Chat UI
- Message history
- Conversation list
- Settings
- API integration

## Creating a New Template

### 1. Setup Project

```bash
# Create new Expo project
npx create-expo-app templates/my-template --template tabs

cd templates/my-template

# Add NativeWind
npm install nativewind
npm install -D tailwindcss
npx tailwindcss init
```

### 2. Configure NativeWind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 3. Add Theme System

```typescript
// theme/colors.ts
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  background: '#FFFFFF',
  text: '#000000',
  // ...
};
```

### 4. Create Components

Follow the component patterns from existing templates.

### 5. Initialize Bare Repo

```bash
# Create bare repo
mkdir templates-bare/my-template.git
cd templates-bare/my-template.git
git init --bare

# Initialize and push template
cd templates/my-template
git init
git add -A
git commit -m "Initial commit"
git remote add origin ../../templates-bare/my-template.git
git push -u origin main
```

### 6. Register Template

Update `TemplateManager` in `@mobigen/storage` to include the new template.

## Template Context

Templates provide context for AI agents:

```typescript
interface TemplateContext {
  name: string;
  description: string;
  screens: ScreenInfo[];
  components: ComponentInfo[];
  hooks: HookInfo[];
  services: ServiceInfo[];
  theme: ThemeInfo;
}
```

This context helps AI agents understand what the template provides and how to extend it.

## Best Practices

### Code Organization

- Keep components small and focused
- Use consistent naming conventions
- Group related files together
- Export from index files

### Styling

- Use NativeWind utilities
- Define theme colors centrally
- Support dark mode
- Use consistent spacing

### TypeScript

- Define types for all data
- Use strict mode
- Export types for reuse
- Avoid `any` types

### Performance

- Use memo for expensive components
- Implement proper list rendering
- Lazy load screens
- Optimize images

## Related Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Main README](../README.md)
