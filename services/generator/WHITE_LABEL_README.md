# White-Label Branding Service

Enterprise white-label branding support for Mobigen generated apps.

## Features

- Custom app name and bundle IDs (iOS & Android)
- Brand color customization (primary, secondary, accent)
- Automated asset generation:
  - iOS app icons (all sizes, including App Store 1024x1024)
  - Android adaptive icons (foreground/background layers)
  - Splash screens for all device sizes
- Theme file generation
- App configuration updates

## API Endpoints

### Apply Branding

```http
POST /api/projects/:projectId/branding
Content-Type: application/json

{
  "appName": "My Coffee Shop",
  "displayName": "Coffee Shop",
  "bundleId": {
    "ios": "com.mycoffeeshop.app",
    "android": "com.mycoffeeshop.app"
  },
  "branding": {
    "primaryColor": "#8B4513",
    "secondaryColor": "#D2691E",
    "accentColor": "#FFD700",
    "backgroundColor": "#FFFFFF",
    "logo": {
      "light": "https://example.com/logo.png"
    },
    "splash": {
      "backgroundColor": "#8B4513",
      "image": "https://example.com/splash.png",
      "resizeMode": "contain"
    }
  },
  "storeMetadata": {
    "shortDescription": "Your daily coffee companion",
    "fullDescription": "Order coffee, earn rewards...",
    "keywords": ["coffee", "rewards", "mobile ordering"],
    "category": "Food & Drink"
  }
}
```

**Response:**

```json
{
  "success": true,
  "assets": {
    "icons": {
      "ios": [
        {
          "path": "assets/icons/ios/icon-20@2x.png",
          "size": { "width": 40, "height": 40 },
          "format": "png",
          "purpose": "iOS icon 20pt @2x"
        }
        // ... more icons
      ],
      "android": [
        {
          "path": "assets/icons/android/mipmap-mdpi/ic_launcher_foreground.png",
          "size": { "width": 48, "height": 48 },
          "format": "png",
          "purpose": "Android foreground mdpi"
        }
        // ... more icons
      ]
    },
    "splash": {
      "ios": [...],
      "android": [...]
    }
  },
  "config": {
    "appJson": { /* updated app.json */ },
    "themeFile": "src/theme/colors.ts",
    "constantsFile": "src/constants/branding.ts"
  },
  "errors": [],
  "warnings": []
}
```

### Get Current Branding

```http
GET /api/projects/:projectId/branding
```

**Response:**

```json
{
  "success": true,
  "branding": {
    "appName": "My Coffee Shop",
    "displayName": "Coffee Shop",
    "bundleId": {
      "ios": "com.mycoffeeshop.app",
      "android": "com.mycoffeeshop.app"
    },
    "branding": {
      "primaryColor": "#8B4513",
      "secondaryColor": "#D2691E",
      "logo": {
        "light": "./assets/icon.png"
      },
      "splash": {
        "backgroundColor": "#8B4513"
      }
    }
  }
}
```

### Preview Branding

Preview branding changes without applying them to the project:

```http
POST /api/projects/:projectId/branding/preview
Content-Type: application/json

{
  "appName": "Test App",
  "bundleId": {
    "ios": "com.test.app",
    "android": "com.test.app"
  },
  "branding": {
    "primaryColor": "#FF0000",
    "secondaryColor": "#00FF00",
    "logo": {
      "light": "https://example.com/logo.png"
    },
    "splash": {
      "backgroundColor": "#FFFFFF"
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "preview": {
    "appJson": { /* sample app.json */ },
    "colors": {
      "primary": "#FF0000",
      "secondary": "#00FF00",
      "accent": null
    },
    "bundleId": {
      "ios": "com.test.app",
      "android": "com.test.app"
    }
  },
  "warnings": ["This is a preview. Assets not saved to project."]
}
```

## WebSocket Events

The service emits real-time progress via WebSocket:

```javascript
socket.on('branding:applied', (data) => {
  console.log('Branding applied:', data);
  // {
  //   projectId: "abc123",
  //   success: true,
  //   assetsGenerated: {
  //     ios: 25,
  //     android: 18
  //   }
  // }
});
```

## Validation

The service validates:

- **App name**: Required, non-empty
- **Bundle IDs**: Must match pattern `com.company.appname`
- **Colors**: Must be valid hex colors (#RRGGBB or #RGB)
- **Logo**: Required (URL or base64)

Invalid configurations return `400 Bad Request` with error details.

## Generated Assets

### iOS Icons

Generated sizes (in pt):
- 20pt (@2x, @3x) - Notification
- 29pt (@2x, @3x) - Settings
- 40pt (@2x, @3x) - Spotlight
- 60pt (@2x, @3x) - App
- 76pt (@1x, @2x) - iPad
- 83.5pt (@2x) - iPad Pro
- 1024pt (@1x) - App Store

### Android Icons

Generated densities:
- mdpi (48x48)
- hdpi (72x72)
- xhdpi (96x96)
- xxhdpi (144x144)
- xxxhdpi (192x192)

For each density:
- `ic_launcher_foreground.png` (logo)
- `ic_launcher_background.png` (solid color)
- `ic_launcher_round.png` (legacy round icon)

### Splash Screens

iOS sizes:
- 1242x2688 (iPhone XS Max, 11 Pro Max)
- 1125x2436 (iPhone X, XS, 11 Pro)
- 828x1792 (iPhone XR, 11)
- 750x1334 (iPhone 8, SE)
- 1242x2208 (iPhone 8 Plus)
- 2048x2732 (iPad Pro 12.9")
- 1668x2388 (iPad Pro 11")

Android sizes:
- 480x800 (mdpi)
- 720x1280 (hdpi)
- 1080x1920 (xhdpi)
- 1440x2560 (xxhdpi)
- 1800x3200 (xxxhdpi)

## Generated Files

### Theme File (`src/theme/colors.ts`)

```typescript
export const brandColors = {
  primary: '#8B4513',
  secondary: '#D2691E',
  accent: '#FFD700',
  background: '#FFFFFF',

  // Derived colors
  primaryLight: '#A0522D',
  primaryDark: '#654321',
  secondaryLight: '#DEB887',
  secondaryDark: '#CD853F',
} as const;

export const theme = {
  colors: {
    ...brandColors,
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    // ...
  },
  // ...
} as const;
```

### Constants File (`src/constants/branding.ts`)

```typescript
export const BRANDING = {
  appName: 'My Coffee Shop',
  displayName: 'Coffee Shop',
  bundleId: {
    ios: 'com.mycoffeeshop.app',
    android: 'com.mycoffeeshop.app',
  },
  storeMetadata: {
    shortDescription: 'Your daily coffee companion',
    fullDescription: 'Order coffee, earn rewards...',
    keywords: ['coffee', 'rewards', 'mobile ordering'],
    category: 'Food & Drink',
  },
} as const;
```

## Image Sources

Logos and splash images can be provided as:

1. **URLs**: `https://example.com/logo.png`
2. **Base64**: `data:image/png;base64,iVBORw0KGgoAAAANS...`
3. **File paths**: `/path/to/logo.png` (server-side only)

Recommended formats: PNG with transparency for logos.

## Error Handling

Common errors:

- **Invalid bundle ID**: Returns validation error with pattern requirements
- **Invalid color format**: Returns error with example format
- **Missing logo**: Returns error requiring logo URL or base64
- **Asset generation failure**: Returns 500 with detailed error message

## Usage Example

```typescript
import { getWhiteLabelService } from '@mobigen/generator';

const service = getWhiteLabelService();

const result = await service.applyBranding('project-123', {
  appName: 'My Coffee Shop',
  displayName: 'Coffee Shop',
  bundleId: {
    ios: 'com.mycoffeeshop.app',
    android: 'com.mycoffeeshop.app',
  },
  branding: {
    primaryColor: '#8B4513',
    secondaryColor: '#D2691E',
    logo: {
      light: 'https://example.com/logo.png',
    },
    splash: {
      backgroundColor: '#8B4513',
    },
  },
});

if (result.success) {
  console.log(`Generated ${result.assets.icons.ios.length} iOS icons`);
  console.log(`Generated ${result.assets.icons.android.length} Android icons`);
}
```

## Dependencies

- `canvas` - Image processing and generation
- Built-in Node.js `fs/promises` for file operations

## Future Enhancements

- [ ] Custom fonts
- [ ] Dark mode logos
- [ ] Animated splash screens
- [ ] Custom app icon shapes
- [ ] Favicon generation for web
- [ ] Preview rendering (actual icon/splash preview images)
