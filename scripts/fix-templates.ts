#!/usr/bin/env npx tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const templatesDir = './templates';

// NativeWind type declaration content
const nativewindDts = `/// <reference types="nativewind/types" />

// NativeWind v4 type augmentation for React Native components
// This adds the \`className\` prop to all React Native components

import 'react-native';
import { SvgProps } from 'react-native-svg';

// Lucide React Native type augmentation
declare module 'lucide-react-native' {
  import { FC } from 'react';

  export interface LucideProps extends SvgProps {
    size?: number | string;
    color?: string;
    fill?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = FC<LucideProps>;
}

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
  interface SectionListProps<ItemT, SectionT> {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface ModalProps {
    className?: string;
  }
}

// SafeAreaView from react-native-safe-area-context
declare module 'react-native-safe-area-context' {
  interface SafeAreaViewProps {
    className?: string;
  }
}
`;

// ESLint v9 flat config content
const eslintConfig = `// @ts-check
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['node_modules/**', '__tests__/**', '*.config.js', 'babel.config.js', 'metro.config.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Basic rules - not too strict for generated code
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
  },
];
`;

// TSConfig template
const tsconfigTemplate = `{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "__tests__", "*.test.ts", "*.test.tsx"]
}
`;

async function createPlaceholderAssets(assetsDir: string): Promise<void> {
  // Check if sharp is available
  try {
    const sharp = require('sharp');

    async function createPlaceholder(
      filename: string,
      width: number,
      height: number,
      color: string = '#0d9488'
    ): Promise<void> {
      const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${color}"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
              fill="white" font-family="Arial" font-size="${Math.min(width, height) / 6}">
          Mobigen
        </text>
      </svg>`;

      await sharp(Buffer.from(svg)).png().toFile(path.join(assetsDir, filename));
    }

    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const existingFiles = fs.readdirSync(assetsDir);

    if (!existingFiles.includes('icon.png')) {
      await createPlaceholder('icon.png', 1024, 1024);
      console.log('    ✓ Created icon.png');
    }
    if (!existingFiles.includes('adaptive-icon.png')) {
      await createPlaceholder('adaptive-icon.png', 1024, 1024);
      console.log('    ✓ Created adaptive-icon.png');
    }
    if (!existingFiles.includes('splash.png')) {
      await createPlaceholder('splash.png', 1242, 2436);
      console.log('    ✓ Created splash.png');
    }
    if (!existingFiles.includes('favicon.png')) {
      await createPlaceholder('favicon.png', 48, 48);
      console.log('    ✓ Created favicon.png');
    }
  } catch (error) {
    console.log('    ⚠ Sharp not available, skipping asset generation');
  }
}

async function fixTemplate(templatePath: string): Promise<void> {
  const templateName = path.basename(templatePath);
  console.log(`\n📦 Fixing ${templateName}...`);

  // Skip non-directories and special directories
  if (!fs.statSync(templatePath).isDirectory()) return;
  if (templateName === 'shared' || templateName === 'base') return;

  // Check if it's a valid template (has package.json)
  const packageJsonPath = path.join(templatePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('  ⚠ No package.json, skipping');
    return;
  }

  // 1. Create src/types directory if needed
  const typesDir = path.join(templatePath, 'src', 'types');
  if (!fs.existsSync(typesDir)) {
    fs.mkdirSync(typesDir, { recursive: true });
    console.log('  ✓ Created src/types directory');
  }

  // 2. Create nativewind.d.ts
  const nativewindPath = path.join(typesDir, 'nativewind.d.ts');
  if (!fs.existsSync(nativewindPath)) {
    fs.writeFileSync(nativewindPath, nativewindDts);
    console.log('  ✓ Created nativewind.d.ts');
  }

  // 3. Create/update eslint.config.js
  const eslintPath = path.join(templatePath, 'eslint.config.js');
  if (!fs.existsSync(eslintPath)) {
    fs.writeFileSync(eslintPath, eslintConfig);
    console.log('  ✓ Created eslint.config.js');
  }

  // 4. Update tsconfig.json to exclude tests
  const tsconfigPath = path.join(templatePath, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    let updated = false;

    // Ensure paths are set
    if (!tsconfig.compilerOptions?.paths?.['@/*']) {
      tsconfig.compilerOptions = tsconfig.compilerOptions || {};
      tsconfig.compilerOptions.baseUrl = '.';
      tsconfig.compilerOptions.paths = { '@/*': ['src/*'] };
      updated = true;
    }

    // Ensure exclude includes test files
    const requiredExcludes = ['node_modules', '__tests__', '*.test.ts', '*.test.tsx'];
    if (!tsconfig.exclude || !requiredExcludes.every((e) => tsconfig.exclude.includes(e))) {
      tsconfig.exclude = requiredExcludes;
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
      console.log('  ✓ Updated tsconfig.json');
    }
  } else {
    fs.writeFileSync(tsconfigPath, tsconfigTemplate);
    console.log('  ✓ Created tsconfig.json');
  }

  // 5. Create assets directory with placeholder images
  const assetsDir = path.join(templatePath, 'assets');
  await createPlaceholderAssets(assetsDir);

  // 6. Check/install node_modules
  const nodeModulesPath = path.join(templatePath, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('  📥 Installing dependencies...');
    try {
      execSync('npm install', { cwd: templatePath, stdio: 'pipe' });
      console.log('  ✓ Dependencies installed');
    } catch (error) {
      console.log('  ⚠ Failed to install dependencies');
    }
  }

  // 7. Install sharp as dev dependency if not present
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  if (!packageJson.devDependencies?.sharp) {
    console.log('  📥 Installing sharp...');
    try {
      execSync('npm install --save-dev sharp', { cwd: templatePath, stdio: 'pipe' });
      console.log('  ✓ Sharp installed');
    } catch (error) {
      console.log('  ⚠ Failed to install sharp');
    }
  }
}

async function main() {
  console.log('🔧 Template Fixer\n');
  console.log('This script applies common fixes to all templates:');
  console.log('  - NativeWind type declarations');
  console.log('  - ESLint v9 flat config');
  console.log('  - TSConfig with proper excludes');
  console.log('  - Placeholder assets');
  console.log('');

  const templates = fs.readdirSync(templatesDir).filter((name) => {
    const fullPath = path.join(templatesDir, name);
    return (
      fs.statSync(fullPath).isDirectory() &&
      name !== 'shared' &&
      name !== 'base' &&
      fs.existsSync(path.join(fullPath, 'package.json'))
    );
  });

  console.log(`Found ${templates.length} templates to fix\n`);

  for (const template of templates) {
    await fixTemplate(path.join(templatesDir, template));
  }

  console.log('\n✅ All templates processed!');
  console.log('Run certification to verify: npx tsx scripts/certify-all-templates.ts');
}

main().catch(console.error);
