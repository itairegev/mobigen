---
id: form-handling
name: Form Handling
description: Create forms with validation, error handling, and proper UX patterns
category: Development
capabilities:
  - forms
  - validation
  - user-input
tools:
  - Read
  - Write
  - Edit
compatibleAgents:
  - developer
  - ui-ux-expert
parallelizable: true
priority: 7
inputs:
  - name: formName
    description: Name of the form
    type: string
    required: true
  - name: fields
    description: Form fields to include
    type: array
    required: true
outputs:
  - name: formPath
    description: Path to the form component
    type: file
---

# Form Handling Skill

When creating forms, follow these patterns:

## Recommended Libraries

- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@hookform/resolvers**: Zod integration

## Form Template

```tsx
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

// 2. Create form component
export function LoginForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <View className="space-y-4">
      {/* Email Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              testID="email-input"
            />
          )}
        />
        {errors.email && (
          <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>
        )}
      </View>

      {/* Password Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3"
              placeholder="Enter your password"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              testID="password-input"
            />
          )}
        />
        {errors.password && (
          <Text className="text-red-500 text-sm mt-1">{errors.password.message}</Text>
        )}
      </View>

      {/* Submit Button */}
      <Pressable
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        testID="submit-button"
      >
        <Text className="text-white font-semibold">
          {isSubmitting ? 'Loading...' : 'Submit'}
        </Text>
      </Pressable>
    </View>
  );
}
```

## Reusable Input Component

```tsx
import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

interface FormInputProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  error?: string;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ...props
}: FormInputProps<T>) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            className={`border rounded-lg px-4 py-3 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            {...props}
          />
        )}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
```

## Validation Patterns

```typescript
// Common validation schemas
const emailSchema = z.string().email('Invalid email');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number');

const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

const urlSchema = z.string().url('Invalid URL');

// Conditional validation
const conditionalSchema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  (data) => !data.hasCompany || (data.hasCompany && data.companyName),
  { message: 'Company name required when hasCompany is true', path: ['companyName'] }
);
```

## Best Practices

1. **Validation**
   - Validate on blur for immediate feedback
   - Validate on submit for final check
   - Show clear error messages

2. **Accessibility**
   - Label all inputs properly
   - Announce errors to screen readers
   - Support keyboard navigation

3. **UX**
   - Disable submit during loading
   - Show loading state
   - Handle network errors gracefully

4. **Performance**
   - Use controlled inputs only when needed
   - Memoize validation schemas
   - Debounce async validation
