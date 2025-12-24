---
id: react-native-component
name: React Native Component Creation
description: Create well-structured React Native components with TypeScript and NativeWind styling
category: Development
capabilities:
  - component-creation
  - typescript
  - nativewind
tools:
  - Read
  - Write
  - Glob
compatibleAgents:
  - developer
  - mobile-developer
  - ui-ux-expert
parallelizable: true
priority: 10
inputs:
  - name: componentName
    description: Name of the component (PascalCase)
    type: string
    required: true
  - name: componentType
    description: Type of component (screen, component, modal)
    type: string
    required: false
    default: component
outputs:
  - name: componentPath
    description: Path to the created component file
    type: file
---

# React Native Component Creation Skill

When creating React Native components, follow these patterns:

## File Structure

For a component named `{ComponentName}`:
```
src/components/{ComponentName}/
├── index.tsx           # Main component
├── {ComponentName}.tsx # Implementation (if complex)
├── types.ts            # TypeScript types
└── hooks.ts            # Component-specific hooks (if needed)
```

For a screen:
```
src/screens/{ScreenName}/
├── index.tsx           # Main screen
└── components/         # Screen-specific components
```

## Component Template

```tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { FC } from 'react';

interface {ComponentName}Props {
  // Define props here
}

export const {ComponentName}: FC<{ComponentName}Props> = ({
  // Destructure props
}) => {
  return (
    <View className="flex-1 bg-white">
      {/* Component content */}
    </View>
  );
};
```

## Best Practices

1. **TypeScript**
   - Define interfaces for all props
   - Use proper generic types for hooks
   - Export types from types.ts

2. **NativeWind Styling**
   - Use className for all styling
   - Follow Tailwind conventions
   - Use responsive classes when needed

3. **Accessibility**
   - Add testID for testing
   - Include accessibilityLabel where appropriate
   - Support accessibilityRole

4. **Performance**
   - Memoize expensive computations
   - Use useCallback for callbacks
   - Avoid inline object styles
