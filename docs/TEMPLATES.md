# Mobigen Templates Guide

This guide covers how to create, update, and maintain templates for Mobigen.

## Table of Contents

- [Template Overview](#template-overview)
- [Template Structure](#template-structure)
- [Creating a New Template](#creating-a-new-template)
- [Updating Existing Templates](#updating-existing-templates)
- [Template Configuration](#template-configuration)
- [AST Generation](#ast-generation)
- [Testing Templates](#testing-templates)
- [Best Practices](#best-practices)

---

## Template Overview

Templates are production-ready React Native + Expo apps that serve as starting points for generated apps. Each template:

- Is a complete, working Expo app
- Follows consistent patterns and conventions
- Includes pre-generated AST for LLM context optimization
- Can be customized by AI agents during generation

### Available Templates

| Template | Category | Description |
|----------|----------|-------------|
| `base` | Foundation | Minimal starter with core utilities |
| `ecommerce` | Commerce | Product catalog, cart, checkout |
| `loyalty` | Engagement | Points, rewards, QR scanning |
| `news` | Content | Article feed, categories, bookmarks |
| `ai-assistant` | AI | Chat interface, conversation history |

---

## Template Structure

Every template follows this structure:

```
templates/{template-name}/
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # NativeWind/Tailwind config
├── template.json               # Template metadata
├── template.ast.json           # Pre-generated AST (auto-generated)
├── template.ast.md             # Human-readable AST summary (auto-generated)
├── README.md                   # Template documentation
├── assets/
│   ├── icon.png               # App icon (1024x1024)
│   ├── splash.png             # Splash screen
│   ├── adaptive-icon.png      # Android adaptive icon
│   └── favicon.png            # Web favicon
├── src/
│   ├── app/                   # Expo Router screens
│   │   ├── _layout.tsx        # Root layout
│   │   ├── (tabs)/            # Tab navigation group
│   │   │   ├── _layout.tsx    # Tab layout
│   │   │   ├── index.tsx      # Home tab
│   │   │   └── settings.tsx   # Settings tab
│   │   └── [dynamic]/         # Dynamic routes
│   ├── components/            # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts           # Barrel export
│   ├── hooks/                 # Custom React hooks
│   │   ├── useTheme.ts
│   │   └── index.ts
│   ├── services/              # API and data services
│   │   ├── api.ts
│   │   ├── storage.ts
│   │   └── index.ts
│   ├── theme/                 # Theming system
│   │   ├── colors.ts
│   │   └── index.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   └── index.ts
│   └── global.css             # Global styles
└── .maestro/                  # E2E test flows (optional)
    └── flow.yaml
```

---

## Creating a New Template

### Step 1: Create from Base Template

```bash
# Copy the base template
cp -r templates/base templates/my-template

# Navigate to new template
cd templates/my-template
```

### Step 2: Update Template Metadata

Edit `template.json`:

```json
{
  "id": "my-template",
  "name": "My Template",
  "description": "Description of what this template is for",
  "category": "custom",
  "version": "1.0.0",
  "features": [
    "feature-1",
    "feature-2"
  ],
  "requiredDependencies": [
    "expo-camera"
  ],
  "screens": [
    "Home",
    "Settings"
  ]
}
```

### Step 3: Update App Configuration

Edit `app.json`:

```json
{
  "expo": {
    "name": "My Template",
    "slug": "my-template",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "my-template",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.mobigen.mytemplate"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.mobigen.mytemplate"
    }
  }
}
```

### Step 4: Implement Template Features

Add your screens, components, hooks, and services following the established patterns:

**Screen Example** (`src/app/(tabs)/index.tsx`):
```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Home
        </Text>
      </View>
    </SafeAreaView>
  );
}
```

**Component Example** (`src/components/Button.tsx`):
```typescript
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  testID?: string;
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  testID
}: ButtonProps) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={loading}
      className={`px-6 py-3 rounded-lg ${
        variant === 'primary'
          ? 'bg-blue-500'
          : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={`font-semibold text-center ${
          variant === 'primary'
            ? 'text-white'
            : 'text-slate-900 dark:text-white'
        }`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

**Hook Example** (`src/hooks/useTheme.ts`):
```typescript
import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();

  return {
    isDark: colorScheme === 'dark',
    colors: {
      background: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
      text: colorScheme === 'dark' ? '#ffffff' : '#0f172a',
      primary: '#3b82f6',
    },
  };
}
```

### Step 5: Update Barrel Exports

Ensure all exports are in index.ts files:

```typescript
// src/components/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
```

### Step 6: Generate AST

```bash
# From the repository root
cd /path/to/mobigen

# Generate AST for all templates
cd services/generator
./node_modules/.bin/tsx ../../scripts/generate-template-ast.ts
```

### Step 7: Test the Template

```bash
# Navigate to template
cd templates/my-template

# Install dependencies
npm install

# Start the app
npx expo start
```

### Step 8: Commit Changes

```bash
cd /path/to/mobigen
git add templates/my-template
git commit -m "Add my-template for [use case]"
```

---

## Updating Existing Templates

### Making Changes

1. **Edit files** in `templates/{template-name}/`
2. **Test locally** with `npx expo start`
3. **Regenerate AST** (automatic via GitHub Action, or manual)
4. **Commit changes**

### Manual AST Regeneration

```bash
cd services/generator
./node_modules/.bin/tsx ../../scripts/generate-template-ast.ts
```

### Automatic AST Regeneration

AST files are automatically regenerated when:
- A PR is opened/updated with template changes
- Code is pushed to `main` branch with template changes

See `.github/workflows/template-ast.yml` for the workflow.

---

## Template Configuration

### template.json Schema

```typescript
interface TemplateConfig {
  // Unique identifier (must match directory name)
  id: string;

  // Display name
  name: string;

  // Short description
  description: string;

  // Category for grouping
  category: 'base' | 'commerce' | 'content' | 'social' | 'utility' | 'custom';

  // Semantic version
  version: string;

  // List of features this template provides
  features: string[];

  // NPM packages required beyond base
  requiredDependencies?: string[];

  // Optional dependencies user can enable
  optionalDependencies?: string[];

  // List of screen names
  screens: string[];

  // AI context hints
  aiHints?: {
    // What this template is best for
    bestFor: string[];
    // What it's NOT suitable for
    notFor: string[];
    // Key customization points
    customizationPoints: string[];
  };
}
```

### Example template.json

```json
{
  "id": "ecommerce",
  "name": "E-Commerce",
  "description": "Full-featured e-commerce app with product catalog, cart, and checkout",
  "category": "commerce",
  "version": "1.0.0",
  "features": [
    "product-catalog",
    "shopping-cart",
    "categories",
    "search",
    "user-profile"
  ],
  "requiredDependencies": [
    "@stripe/stripe-react-native"
  ],
  "optionalDependencies": [
    "expo-barcode-scanner"
  ],
  "screens": [
    "Home",
    "Categories",
    "ProductDetail",
    "Cart",
    "Checkout",
    "Profile",
    "Settings"
  ],
  "aiHints": {
    "bestFor": [
      "online stores",
      "product catalogs",
      "shopping apps"
    ],
    "notFor": [
      "social networking",
      "content publishing",
      "games"
    ],
    "customizationPoints": [
      "product card design",
      "checkout flow",
      "category navigation"
    ]
  }
}
```

---

## AST Generation

### What is AST?

AST (Abstract Syntax Tree) is a structured representation of the template's code. It provides:

- **Screens**: All screen components with their hooks and JSX elements
- **Components**: Reusable UI components with imports/exports
- **Hooks**: Custom hooks with their dependencies
- **Services**: API/data services with function signatures
- **Navigation**: Route structure (Expo Router)
- **Types**: TypeScript interfaces and types

### Why Pre-Generate AST?

| Without AST | With AST |
|-------------|----------|
| LLM reads all files (~50KB) | LLM reads summary (~2KB) |
| Runtime parsing on every generation | Instant load from file |
| May miss existing patterns | Complete structure visible |
| ~12,500 tokens | ~500 tokens |

### AST Files

Each template gets two AST files:

1. **template.ast.json** - Full structured data
2. **template.ast.md** - Human-readable summary

### AST Structure

```typescript
interface TemplateAST {
  templateId: string;
  generatedAt: string;
  version: string;
  structure: {
    screens: ComponentInfo[];
    components: ComponentInfo[];
    hooks: HookInfo[];
    services: ServiceInfo[];
    navigation: NavigationInfo;
    types: TypeInfo[];
  };
  summary: string;  // Markdown summary
  stats: {
    totalFiles: number;
    totalScreens: number;
    totalComponents: number;
    totalHooks: number;
    totalServices: number;
    totalTypes: number;
  };
}
```

---

## Testing Templates

### Local Testing

```bash
cd templates/my-template
npm install
npx expo start
```

### TypeScript Check

```bash
npx tsc --noEmit
```

### Lint Check

```bash
npx eslint src/ --ext .ts,.tsx
```

### E2E Testing with Maestro

Create `.maestro/flow.yaml`:

```yaml
appId: com.mobigen.mytemplate
---
- launchApp
- assertVisible: "Home"
- tapOn: "Settings"
- assertVisible: "Settings"
```

Run tests:
```bash
maestro test .maestro/flow.yaml
```

---

## Best Practices

### Code Standards

1. **TypeScript** - Always use strict types
2. **NativeWind** - Use Tailwind classes for styling
3. **Functional Components** - Use hooks, not class components
4. **testID** - Add to all interactive elements
5. **Barrel Exports** - Use index.ts for cleaner imports

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Screens | PascalCase + Screen | `HomeScreen` |
| Components | PascalCase | `ProductCard` |
| Hooks | camelCase + use prefix | `useProducts` |
| Services | camelCase | `api`, `storage` |
| Types | PascalCase | `Product`, `User` |

### File Organization

- One component per file
- Colocate related files
- Use barrel exports
- Keep services thin (logic in hooks)

### Performance

- Use `React.memo` for expensive components
- Use `useCallback` for callbacks passed to children
- Use `useMemo` for expensive calculations
- Lazy load screens with `React.lazy`

### Accessibility

- Add `accessibilityLabel` to buttons
- Use semantic heading levels
- Support dynamic type sizes
- Test with screen readers

---

## Troubleshooting

### AST Generation Fails

```bash
# Check for TypeScript errors first
cd templates/my-template
npx tsc --noEmit

# Fix errors, then regenerate
cd ../../services/generator
./node_modules/.bin/tsx ../../scripts/generate-template-ast.ts
```

### Template Not Working

1. Check `app.json` is valid JSON
2. Verify all imports resolve
3. Run `npm install` to ensure dependencies
4. Check Expo SDK version compatibility

### GitHub Action Fails

1. Check workflow logs in Actions tab
2. Verify template has valid TypeScript
3. Ensure no circular dependencies

---

## Contributing

1. Create a branch for your template
2. Follow the structure and conventions
3. Test thoroughly
4. Open a PR with description
5. AST will be auto-generated
6. Request review

For questions, open an issue or check existing templates for patterns.
