# @mobigen/ui

Shared React UI components for Mobigen.

## Overview

This package provides reusable React components for the Mobigen web dashboard. Built with Tailwind CSS and designed for consistency across the application.

## Tech Stack

- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Tailwind transitions
- **Language**: TypeScript

## Installation

```bash
pnpm add @mobigen/ui
```

## Features

- Pre-built UI components
- Consistent styling
- Dark mode support
- Accessible (ARIA compliant)
- Fully typed with TypeScript

## Directory Structure

```
src/
├── index.ts              # Main exports
├── components/           # UI components
│   ├── Button.tsx        # Button component
│   ├── Card.tsx          # Card component
│   ├── Input.tsx         # Input component
│   ├── Modal.tsx         # Modal component
│   ├── Select.tsx        # Select component
│   ├── Badge.tsx         # Badge component
│   ├── Avatar.tsx        # Avatar component
│   ├── Spinner.tsx       # Loading spinner
│   ├── Progress.tsx      # Progress bar
│   ├── Toast.tsx         # Toast notifications
│   └── index.ts          # Component exports
├── utils/                # Utility functions
│   ├── cn.ts             # Class name merger
│   └── variants.ts       # Variant helpers
└── types.ts              # Shared types
```

## Usage

### Button

```tsx
import { Button } from '@mobigen/ui';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <PlusIcon className="w-4 h-4 mr-2" />
  Add Project
</Button>

// Loading state
<Button loading>Processing...</Button>

// Disabled
<Button disabled>Disabled</Button>
```

### Card

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@mobigen/ui';

<Card>
  <CardHeader>
    <h3 className="text-lg font-semibold">Project Name</h3>
    <p className="text-gray-500">Description</p>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button variant="primary">View Details</Button>
  </CardFooter>
</Card>

// Variants
<Card variant="elevated">Elevated card</Card>
<Card variant="outlined">Outlined card</Card>
```

### Input

```tsx
import { Input } from '@mobigen/ui';

// Basic
<Input placeholder="Enter text..." />

// With label
<Input label="Email" type="email" placeholder="you@example.com" />

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With icon
<Input
  placeholder="Search..."
  leftIcon={<SearchIcon className="w-4 h-4" />}
/>
```

### Modal

```tsx
import { Modal } from '@mobigen/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <p>Are you sure you want to continue?</p>
  <div className="flex gap-2 mt-4">
    <Button variant="outline" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </div>
</Modal>
```

### Select

```tsx
import { Select } from '@mobigen/ui';

<Select
  label="Template"
  value={template}
  onChange={setTemplate}
  options={[
    { value: 'base', label: 'Base Template' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'loyalty', label: 'Loyalty Program' },
  ]}
/>
```

### Badge

```tsx
import { Badge } from '@mobigen/ui';

<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="error">Error</Badge>
<Badge variant="info">Info</Badge>
```

### Progress

```tsx
import { Progress } from '@mobigen/ui';

// Basic
<Progress value={45} />

// With label
<Progress value={75} showLabel />

// Custom colors
<Progress value={90} color="green" />

// Sizes
<Progress value={50} size="sm" />
<Progress value={50} size="md" />
<Progress value={50} size="lg" />
```

### Spinner

```tsx
import { Spinner } from '@mobigen/ui';

<Spinner />
<Spinner size="sm" />
<Spinner size="lg" />
<Spinner className="text-blue-500" />
```

### Toast

```tsx
import { useToast, Toaster } from '@mobigen/ui';

// Add Toaster to your app root
<Toaster />

// Use toast in components
function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    toast.success('Project created successfully!');
    toast.error('Failed to delete project');
    toast.warning('Build taking longer than expected');
    toast.info('New update available');
  };
}
```

## Utility Functions

### cn (Class Name Merger)

```tsx
import { cn } from '@mobigen/ui';

// Merge class names
<div className={cn('base-class', isActive && 'active-class', className)} />

// With conditional classes
<button
  className={cn(
    'px-4 py-2 rounded',
    variant === 'primary' && 'bg-blue-500 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-800',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
>
  Click me
</button>
```

## Theming

Components support both light and dark modes through Tailwind's dark mode classes:

```tsx
// Components automatically adapt to dark mode
<Card className="bg-white dark:bg-gray-800">
  <p className="text-gray-900 dark:text-gray-100">
    This text adapts to the theme
  </p>
</Card>
```

## Customization

### Extending Components

```tsx
import { Button, ButtonProps } from '@mobigen/ui';

interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
}

function IconButton({ icon, children, ...props }: IconButtonProps) {
  return (
    <Button {...props}>
      {icon}
      {children}
    </Button>
  );
}
```

### Custom Variants

```tsx
import { cn } from '@mobigen/ui';

const customVariants = {
  gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20',
};

function GradientButton({ children }) {
  return (
    <button className={cn('px-4 py-2 rounded', customVariants.gradient)}>
      {children}
    </button>
  );
}
```

## Building

```bash
# Build package
pnpm --filter @mobigen/ui build

# Type checking
pnpm --filter @mobigen/ui typecheck

# Storybook (if configured)
pnpm --filter @mobigen/ui storybook
```

## Related Documentation

- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [Main README](../../README.md)
