# @mobigen/config

Shared configuration packages for Mobigen.

## Overview

This directory contains shared configuration packages for TypeScript, ESLint, and Prettier. These ensure consistent code style and build settings across the monorepo.

## Packages

### @mobigen/tsconfig

Shared TypeScript configuration.

### @mobigen/eslint-config

Shared ESLint configuration.

### @mobigen/prettier-config

Shared Prettier configuration.

---

## @mobigen/tsconfig

### Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@mobigen/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Available Configs

| Config | Use Case |
|--------|----------|
| `base.json` | Base TypeScript settings |
| `react.json` | React/Next.js projects |
| `node.json` | Node.js services |
| `library.json` | Shared libraries |

### Base Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## @mobigen/eslint-config

### Usage

In your package's `.eslintrc.js`:

```javascript
module.exports = {
  extends: ['@mobigen/eslint-config'],
};
```

### Available Configs

| Config | Use Case |
|--------|----------|
| `index.js` | Base ESLint rules |
| `react.js` | React-specific rules |
| `next.js` | Next.js-specific rules |
| `node.js` | Node.js-specific rules |

### React Config

```javascript
module.exports = {
  extends: ['@mobigen/eslint-config/react'],
};
```

### Rules Overview

```javascript
{
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // General
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',

    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  }
}
```

---

## @mobigen/prettier-config

### Usage

In your package's `package.json`:

```json
{
  "prettier": "@mobigen/prettier-config"
}
```

Or create `.prettierrc.js`:

```javascript
module.exports = require('@mobigen/prettier-config');
```

### Configuration

```javascript
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};
```

---

## Directory Structure

```
config/
├── tsconfig/
│   ├── base.json         # Base TypeScript config
│   ├── react.json        # React config
│   ├── node.json         # Node.js config
│   ├── library.json      # Library config
│   └── package.json
├── eslint/
│   ├── index.js          # Base ESLint config
│   ├── react.js          # React ESLint config
│   ├── next.js           # Next.js ESLint config
│   ├── node.js           # Node.js ESLint config
│   └── package.json
└── prettier/
    ├── index.js          # Prettier config
    └── package.json
```

## Adding to a New Package

1. Add dependencies to `package.json`:

```json
{
  "devDependencies": {
    "@mobigen/tsconfig": "workspace:*",
    "@mobigen/eslint-config": "workspace:*",
    "@mobigen/prettier-config": "workspace:*"
  }
}
```

2. Create `tsconfig.json`:

```json
{
  "extends": "@mobigen/tsconfig/library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

3. Create `.eslintrc.js`:

```javascript
module.exports = {
  extends: ['@mobigen/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
```

4. Add prettier to `package.json`:

```json
{
  "prettier": "@mobigen/prettier-config"
}
```

## Related Documentation

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [Main README](../../README.md)
