# Sprint 3: Connectors & Integrations - Product Requirements Document

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Sprint Duration:** 5 days
**Target Completion:** January 2026

---

## Executive Summary

Sprint 3 focuses on building a **one-click connector framework** that enables Mobigen users to integrate third-party services into their generated apps with minimal configuration. This addresses a critical competitive gap—Replit has 30+ connectors, Base44 has many built-in integrations, while Mobigen currently has none.

The connector system will transform complex integrations (Stripe payments, Firebase auth, push notifications) from multi-hour development tasks into one-click operations, dramatically reducing time-to-market for generated apps.

**Key Deliverables:**
- Unified connector framework supporting plug-and-play integrations
- 5 production-ready connectors: Stripe, Firebase, Supabase, RevenueCat, OneSignal
- Visual connector management dashboard
- Secure credential storage and configuration system
- Auto-generated code injection for enabled connectors

---

## Problem Statement

### Current State
Users who want to add payments, authentication, or push notifications to their Mobigen-generated apps must:
1. Manually create accounts with third-party services
2. Obtain API keys and configuration values
3. Request AI to add integration code
4. Debug configuration issues
5. Test the integration manually

**Result:** 2-4 hours per integration, high failure rate, poor user experience.

### Competitive Gap
| Platform | Connectors | Setup Experience |
|----------|------------|------------------|
| **Replit** | 30+ connectors | One-click, auto-configured |
| **Base44** | 15+ built-in | Integrated in builder |
| **Lovable** | Supabase native | Pre-configured |
| **Mobigen** | 0 connectors | Manual code + configuration |

### Target State
With Sprint 3 complete, users will:
1. Browse available connectors in dashboard
2. Click "Add Connector" button
3. Authenticate via OAuth or paste API key
4. Connector auto-configures in generated app
5. Code is auto-injected and tested

**Result:** < 5 minutes per integration, 95%+ success rate, delightful experience.

---

## User Stories

### US-01: Non-technical Founder Adds Payments
**As a** non-technical founder building an e-commerce app
**I want to** add Stripe payments with one click
**So that** I can start accepting payments without hiring a developer

**Acceptance Criteria:**
- User clicks "Add Stripe" in connectors dashboard
- OAuth flow redirects to Stripe Connect
- API keys are securely stored (encrypted at rest)
- Payment code is auto-injected into checkout screens
- Test payment works in preview

### US-02: Developer Adds Firebase Authentication
**As a** developer using Mobigen to speed up development
**I want to** integrate Firebase Auth without writing boilerplate
**So that** I can focus on unique business logic

**Acceptance Criteria:**
- User selects Firebase connector
- Pastes Firebase config JSON or uses OAuth
- Auth provider components are auto-generated
- Login/signup screens are updated with Firebase SDK
- Google/Email sign-in works in preview

### US-03: Solopreneur Adds Push Notifications
**As a** solopreneur building a content app
**I want to** enable push notifications via OneSignal
**So that** I can re-engage users without backend work

**Acceptance Criteria:**
- User adds OneSignal connector
- Provides OneSignal App ID
- Push notification code is injected into app.json and App.tsx
- Test notification can be sent from dashboard
- Users receive notifications on device

### US-04: Developer Adds Multiple Connectors
**As a** power user building a complex app
**I want to** add multiple connectors (Stripe + Firebase + RevenueCat)
**So that** I can build a full-featured app quickly

**Acceptance Criteria:**
- Multiple connectors can be enabled simultaneously
- No conflicts between connector code injections
- Each connector has isolated configuration
- Dashboard shows all active connectors
- Can disable/remove connectors without breaking app

### US-05: User Manages Connector Credentials Securely
**As a** security-conscious user
**I want to** ensure my API keys are stored securely
**So that** my credentials aren't exposed or leaked

**Acceptance Criteria:**
- API keys encrypted at rest (AES-256-GCM)
- Credentials never exposed in generated code
- Environment variables used in app
- Can rotate credentials from dashboard
- Audit log of credential access

---

## Feature Specifications

## S3-01: Connector Framework Design

### Overview
Base architecture that all connectors extend. Provides standardized interface for connector lifecycle, configuration management, and code injection.

### Requirements

#### Connector Definition Schema
Every connector must define:
```typescript
interface ConnectorDefinition {
  id: string;                          // 'stripe', 'firebase', etc.
  name: string;                        // Display name
  description: string;                 // Short description
  category: ConnectorCategory;         // 'payments', 'auth', 'analytics', etc.
  logo: string;                        // Logo URL

  // Configuration
  authType: 'oauth' | 'api-key' | 'config-json' | 'manual';
  configSchema: JSONSchema;            // Validation schema for config

  // Capabilities
  capabilities: string[];              // ['payments', 'subscriptions']
  dependencies: string[];              // npm packages to install

  // Code injection
  codeGenerators: {
    dependencies?: CodeGenerator;      // package.json modifications
    config?: CodeGenerator;            // app.json/config modifications
    initialization?: CodeGenerator;    // App.tsx setup code
    components?: CodeGenerator;        // UI components to add
    services?: CodeGenerator;          // Service files to create
    types?: CodeGenerator;             // TypeScript types
    environment?: CodeGenerator;       // .env variables
  };

  // Validation
  validator?: (config: ConnectorConfig) => Promise<ValidationResult>;

  // Documentation
  docsUrl?: string;
  setupGuideUrl?: string;
}
```

#### Connector Lifecycle
1. **Installation**: User selects connector from marketplace
2. **Authentication**: OAuth flow or API key input
3. **Configuration**: Connector-specific settings
4. **Code Generation**: Auto-inject code into project
5. **Validation**: Test connector functionality
6. **Activation**: Enable connector in production
7. **Management**: Update config, rotate keys, disable
8. **Removal**: Clean removal of connector code

#### Code Injection Strategy
Connectors inject code at specific "injection points":
- **Package.json**: Add dependencies
- **app.json**: Add native config (push notifications, deep links)
- **App.tsx**: Add initialization code
- **src/services/**: Add service files
- **src/components/**: Add UI components (payment forms, auth screens)
- **.env**: Add environment variables
- **src/config/**: Add configuration files

Code injection must:
- Be idempotent (running twice produces same result)
- Be reversible (can cleanly remove connector)
- Preserve existing code (merge, don't overwrite)
- Follow project conventions (NativeWind, TypeScript)
- Include comments for clarity

#### Connector Registry
Centralized registry of all available connectors:
```typescript
interface ConnectorRegistry {
  connectors: Map<string, ConnectorDefinition>;

  // CRUD operations
  register(connector: ConnectorDefinition): void;
  get(id: string): ConnectorDefinition | undefined;
  list(category?: ConnectorCategory): ConnectorDefinition[];
  search(query: string): ConnectorDefinition[];
}
```

### Success Metrics
- All 5 connectors use the same framework
- Adding a new connector takes < 4 hours
- Code injection success rate > 98%
- Zero conflicts between connectors

---

## S3-02: Stripe Connector

### Overview
One-click integration for Stripe payment processing. Supports one-time payments, subscriptions, and payment intents.

### Authentication
- **Method**: Stripe Connect OAuth 2.0
- **Flow**:
  1. User clicks "Connect Stripe"
  2. Redirects to Stripe OAuth
  3. User authorizes Mobigen
  4. Stripe returns access token + account ID
  5. Tokens stored encrypted in database

**Alternative**: Manual API key entry (Publishable + Secret)

### Configuration Schema
```typescript
interface StripeConfig {
  // Required
  accountId: string;              // Stripe account ID (from OAuth)
  publishableKey: string;         // pk_test_... or pk_live_...
  secretKey: string;              // sk_test_... or sk_live_... (encrypted)

  // Optional
  webhookSecret?: string;         // whsec_... for webhook validation
  currency: string;               // Default currency (USD, EUR, etc.)
  paymentMethods: string[];       // ['card', 'apple_pay', 'google_pay']
  subscriptionEnabled: boolean;   // Enable subscription features
}
```

### Code Generation

#### Dependencies
```json
{
  "dependencies": {
    "@stripe/stripe-react-native": "^0.37.2",
    "stripe": "^14.10.0"
  }
}
```

#### Initialization (App.tsx)
```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// Wrap app with StripeProvider
<StripeProvider publishableKey={process.env.STRIPE_PUBLISHABLE_KEY}>
  {/* Existing app */}
</StripeProvider>
```

#### Service File (src/services/stripe.ts)
```typescript
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

export class StripeService {
  async createPaymentIntent(amount: number, currency: string): Promise<string>;
  async confirmPayment(paymentIntentId: string): Promise<PaymentResult>;
  async createSubscription(priceId: string): Promise<Subscription>;
}
```

#### UI Components
- `PaymentSheet.tsx`: Pre-built payment form
- `CheckoutButton.tsx`: Trigger payment flow
- `SubscriptionPlans.tsx`: Display subscription tiers

### Validation
1. Test API keys are valid
2. Create test payment intent
3. Verify webhook endpoint (if configured)
4. Check payment methods are supported

### User Experience
1. User clicks "Add Stripe" in Connectors tab
2. Clicks "Connect with Stripe"
3. OAuth flow completes
4. Dashboard shows "Stripe Connected ✓"
5. User selects payment features to enable
6. AI injects payment code into checkout flow
7. Preview shows working payment form

### Success Metrics
- OAuth success rate > 95%
- Payment code injection success > 98%
- Test payment completes in < 2 minutes
- Zero exposed API keys in generated code

---

## S3-03: Firebase Connector

### Overview
One-click integration for Firebase services: Authentication, Firestore, Storage, and Analytics.

### Authentication
- **Method**: Firebase OAuth or manual config JSON
- **Flow**:
  1. User selects Firebase connector
  2. Chooses: "Connect with Google" OR "Paste Firebase Config"
  3. If OAuth: redirects to Google Cloud, selects Firebase project
  4. If manual: pastes Firebase config JSON from console

### Configuration Schema
```typescript
interface FirebaseConfig {
  // Firebase config object (from Firebase Console)
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;

  // Features to enable
  features: {
    auth: {
      enabled: boolean;
      providers: ('email' | 'google' | 'apple' | 'phone')[];
    };
    firestore: {
      enabled: boolean;
      persistenceEnabled: boolean;
    };
    storage: {
      enabled: boolean;
    };
    analytics: {
      enabled: boolean;
    };
  };
}
```

### Code Generation

#### Dependencies
```json
{
  "dependencies": {
    "@react-native-firebase/app": "^19.0.1",
    "@react-native-firebase/auth": "^19.0.1",
    "@react-native-firebase/firestore": "^19.0.1",
    "@react-native-firebase/storage": "^19.0.1",
    "@react-native-firebase/analytics": "^19.0.1",
    "@react-native-google-signin/google-signin": "^11.0.0"
  }
}
```

#### Config (app.json)
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

#### Firebase Config (src/config/firebase.ts)
```typescript
import { initializeApp } from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  projectId: process.env.FIREBASE_PROJECT_ID,
  // ... other config
};

export const app = initializeApp(firebaseConfig);
```

#### Service Files
- `src/services/firebase-auth.ts`: Authentication service
- `src/services/firebase-db.ts`: Firestore service
- `src/services/firebase-storage.ts`: Storage service

#### UI Components
- `LoginScreen.tsx`: Email + social login
- `SignupScreen.tsx`: User registration
- `ProfileScreen.tsx`: User profile with Firebase data

### Validation
1. Test Firebase config is valid
2. Initialize Firebase app
3. Test authentication (anonymous sign-in)
4. Test Firestore read/write (if enabled)
5. Test Storage upload (if enabled)

### User Experience
1. User clicks "Add Firebase"
2. Pastes Firebase config JSON OR connects via OAuth
3. Selects features to enable (Auth, Firestore, etc.)
4. Selects auth providers (Email, Google, Apple)
5. AI injects Firebase code
6. Preview shows working login screen

### Success Metrics
- Config validation success > 98%
- Auth integration success > 95%
- Login flow works in < 3 minutes
- Firestore queries work in preview

---

## S3-04: Supabase Connector

### Overview
One-click integration for Supabase: Auth, Database (PostgreSQL), Storage, and Realtime.

### Authentication
- **Method**: Supabase OAuth or manual API keys
- **Flow**:
  1. User selects Supabase connector
  2. Chooses: "Connect Supabase Project" OR "Enter API Keys"
  3. Provides Supabase URL + Anon Key + Service Role Key

### Configuration Schema
```typescript
interface SupabaseConfig {
  // Required
  projectUrl: string;             // https://xxxxx.supabase.co
  anonKey: string;                // Public anon key
  serviceRoleKey: string;         // Secret service role key (encrypted)

  // Features
  features: {
    auth: {
      enabled: boolean;
      providers: ('email' | 'google' | 'github' | 'magic-link')[];
    };
    database: {
      enabled: boolean;
      tables: string[];           // Tables to generate types for
    };
    storage: {
      enabled: boolean;
      buckets: string[];          // Storage buckets
    };
    realtime: {
      enabled: boolean;
      channels: string[];         // Realtime channels
    };
  };
}
```

### Code Generation

#### Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react-native-url-polyfill": "^2.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

#### Supabase Client (src/services/supabase.ts)
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
```

#### Type Generation
Auto-generate TypeScript types from Supabase schema:
```typescript
// src/types/supabase.ts
export type Database = {
  public: {
    Tables: {
      // ... generated from Supabase schema
    };
  };
};
```

#### UI Components
- `AuthScreen.tsx`: Login/signup with Supabase Auth
- `DataTable.tsx`: Display data from Supabase table
- `ImageUpload.tsx`: Upload to Supabase Storage

### Validation
1. Test Supabase URL is reachable
2. Verify anon key works
3. Test auth (email signup)
4. Test database query
5. Test storage upload (if enabled)
6. Test realtime connection (if enabled)

### User Experience
1. User clicks "Add Supabase"
2. Enters Supabase URL + Keys
3. System fetches database schema
4. User selects tables/buckets to use
5. Types are auto-generated
6. AI injects Supabase code
7. Preview shows working auth + data

### Success Metrics
- Connection success rate > 98%
- Type generation success > 95%
- Auth + database queries work in < 3 minutes
- Realtime updates work in preview

---

## S3-05: RevenueCat Connector

### Overview
One-click integration for in-app purchases and subscriptions via RevenueCat.

### Authentication
- **Method**: RevenueCat API key (manual entry)
- **Flow**:
  1. User creates RevenueCat account
  2. Copies API keys from dashboard
  3. Pastes in Mobigen connector config

### Configuration Schema
```typescript
interface RevenueCatConfig {
  // Required
  apiKey: {
    ios: string;                  // RevenueCat iOS API key
    android: string;              // RevenueCat Android API key
  };

  // Optional
  entitlements: string[];         // Product entitlements
  products: {
    id: string;                   // Product ID
    type: 'subscription' | 'consumable' | 'non-consumable';
    price?: string;
    displayName: string;
  }[];

  // Features
  restorePurchases: boolean;      // Enable restore purchases
  offlineMode: boolean;           // Cache entitlements offline
}
```

### Code Generation

#### Dependencies
```json
{
  "dependencies": {
    "react-native-purchases": "^7.0.0"
  }
}
```

#### Config (app.json)
```json
{
  "expo": {
    "plugins": [
      ["react-native-purchases", {
        "enableAmazonAppstore": false
      }]
    ]
  }
}
```

#### Initialization (App.tsx)
```typescript
import Purchases from 'react-native-purchases';

useEffect(() => {
  Purchases.configure({
    apiKey: Platform.select({
      ios: process.env.REVENUECAT_IOS_KEY,
      android: process.env.REVENUECAT_ANDROID_KEY,
    })!,
  });
}, []);
```

#### Service (src/services/purchases.ts)
```typescript
import Purchases from 'react-native-purchases';

export class PurchaseService {
  async getOfferings(): Promise<Offerings>;
  async purchasePackage(pkg: Package): Promise<PurchaseResult>;
  async restorePurchases(): Promise<void>;
  async checkEntitlement(id: string): Promise<boolean>;
}
```

#### UI Components
- `SubscriptionPlans.tsx`: Display subscription options
- `PaywallScreen.tsx`: Subscription paywall
- `RestorePurchases.tsx`: Restore button

### Validation
1. Test API keys are valid
2. Fetch offerings from RevenueCat
3. Verify products are configured
4. Test purchase flow in sandbox

### User Experience
1. User clicks "Add RevenueCat"
2. Enters iOS + Android API keys
3. System fetches product offerings
4. User maps products to app features
5. AI injects purchase code
6. Preview shows subscription plans

### Success Metrics
- API key validation success > 98%
- Product fetch success > 95%
- Purchase flow works in sandbox
- Entitlement checks work correctly

---

## S3-06: OneSignal Push Connector

### Overview
One-click integration for push notifications via OneSignal.

### Authentication
- **Method**: OneSignal App ID + API Key (manual entry)
- **Flow**:
  1. User creates OneSignal account
  2. Creates new app in OneSignal
  3. Copies App ID + API Key
  4. Pastes in Mobigen connector config

### Configuration Schema
```typescript
interface OneSignalConfig {
  // Required
  appId: string;                  // OneSignal App ID
  apiKey: string;                 // REST API Key (encrypted)

  // Optional
  features: {
    inAppMessaging: boolean;      // Enable in-app messages
    location: boolean;            // Track location for geofencing
    confirmAlerts: boolean;       // Require confirmation for iOS
  };

  // Notification settings
  defaultSound?: string;
  defaultIcon?: string;
  accentColor?: string;
}
```

### Code Generation

#### Dependencies
```json
{
  "dependencies": {
    "react-native-onesignal": "^5.0.0"
  }
}
```

#### Config (app.json)
```json
{
  "expo": {
    "plugins": [
      ["onesignal-expo-plugin", {
        "mode": "production"
      }]
    ],
    "ios": {
      "bundleIdentifier": "...",
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "...",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

#### Initialization (App.tsx)
```typescript
import OneSignal from 'react-native-onesignal';

OneSignal.setAppId(process.env.ONESIGNAL_APP_ID!);

// Prompt for push notification permission
OneSignal.promptForPushNotificationsWithUserResponse((response) => {
  console.log("Prompt response:", response);
});

// Handle notification opened
OneSignal.setNotificationOpenedHandler((notification) => {
  console.log("Notification opened:", notification);
  // Navigate to relevant screen
});
```

#### Service (src/services/push-notifications.ts)
```typescript
import OneSignal from 'react-native-onesignal';

export class PushNotificationService {
  async requestPermission(): Promise<boolean>;
  async sendNotification(message: string, data?: object): Promise<void>;
  async setTags(tags: Record<string, string>): Promise<void>;
  async getUserId(): Promise<string | null>;
}
```

#### UI Components
- `NotificationPermissionPrompt.tsx`: Custom permission UI
- `NotificationSettings.tsx`: Manage notification preferences

### Validation
1. Test OneSignal App ID is valid
2. Test API key works
3. Send test notification
4. Verify notification received on device

### User Experience
1. User clicks "Add OneSignal"
2. Enters App ID + API Key
3. Configures notification settings
4. AI injects push notification code
5. User sends test notification from dashboard
6. Notification appears in preview/device

### Success Metrics
- OneSignal setup success > 98%
- Test notification delivery > 95%
- Notification opened events tracked
- User can send push from dashboard

---

## S3-07: Connector UI in Dashboard

### Overview
Visual interface for managing connectors: browsing, adding, configuring, and monitoring.

### Components

#### 1. Connector Marketplace
**Location**: `/dashboard/connectors`

**Features**:
- Grid view of all available connectors
- Filter by category (Payments, Auth, Analytics, Push, Database, etc.)
- Search connectors by name/description
- "Popular" and "Recommended" badges
- Each connector shows:
  - Logo
  - Name
  - Short description
  - Category badge
  - "Add" or "Configure" button (if already added)
  - Setup difficulty (Easy/Medium/Advanced)

**Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ Connectors                                    [Search...]    │
├─────────────────────────────────────────────────────────────┤
│ [All] [Payments] [Auth] [Analytics] [Push] [Database]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Stripe  │  │ Firebase │  │ Supabase │  │OneSignal │   │
│  │  [Logo]  │  │  [Logo]  │  │  [Logo]  │  │  [Logo]  │   │
│  │          │  │          │  │          │  │          │   │
│  │ Payments │  │   Auth   │  │ Database │  │   Push   │   │
│  │  Easy    │  │  Medium  │  │  Medium  │  │   Easy   │   │
│  │          │  │          │  │          │  │          │   │
│  │  [Add]   │  │[Connected]  │  [Add]   │  │  [Add]   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │RevenueCat│  │  Twilio  │  │ Sendgrid │  │  Sentry  │   │
│  │  [Logo]  │  │  [Logo]  │  │  [Logo]  │  │  [Logo]  │   │
│  │          │  │          │  │          │  │          │   │
│  │   IAP    │  │   SMS    │  │  Email   │  │  Errors  │   │
│  │  Medium  │  │  Easy    │  │  Easy    │  │  Easy    │   │
│  │          │  │          │  │          │  │          │   │
│  │  [Add]   │  │  [Add]   │  │  [Add]   │  │  [Add]   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Connector Configuration Modal
**Triggered by**: Clicking "Add" on a connector

**Flow**:
1. **Introduction**: What this connector does, benefits
2. **Authentication**: OAuth button OR API key input
3. **Configuration**: Connector-specific settings
4. **Features**: Select which features to enable
5. **Review**: Summary of changes
6. **Confirm**: "Add Connector" button

**Design** (Stripe Example):
```
┌─────────────────────────────────────────────────────────────┐
│ Add Stripe Connector                            [X]          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1 of 4: Connect Your Account                          │
│                                                              │
│  [Stripe Logo]                                               │
│                                                              │
│  Accept payments with Stripe. Enable one-time payments,     │
│  subscriptions, and more.                                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         [Connect with Stripe] (OAuth)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Or enter API keys manually:                                 │
│  Publishable Key: [pk_test_..............................]   │
│  Secret Key:      [sk_test_..............................]   │
│                                                              │
│  [Cancel]                                    [Next →]        │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Active Connectors View
**Location**: `/dashboard/project/[id]/connectors`

**Features**:
- List of all active connectors for this project
- Status indicator (Connected, Error, Disabled)
- Quick actions: Configure, Test, Disable, Remove
- Credential rotation
- Activity log (last used, API calls, errors)

**Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ Active Connectors (3)                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Stripe Logo] Stripe                         ✓ Connected│ │
│  │                                                          │ │
│  │ Account: acct_1234567890                                │ │
│  │ Last used: 5 minutes ago                                │ │
│  │ API calls today: 42                                     │ │
│  │                                                          │ │
│  │ [Configure] [Test] [Disable] [Remove]                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [Firebase Logo] Firebase                     ✓ Connected│ │
│  │                                                          │ │
│  │ Project: my-app-firebase                                │ │
│  │ Features: Auth, Firestore, Storage                      │ │
│  │ Last used: 1 hour ago                                   │ │
│  │                                                          │ │
│  │ [Configure] [Test] [Disable] [Remove]                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [OneSignal Logo] OneSignal                   ⚠ Warning  │ │
│  │                                                          │ │
│  │ App ID: abc123-def456                                   │ │
│  │ Warning: API key expires in 7 days                      │ │
│  │ Notifications sent: 1,234                               │ │
│  │                                                          │ │
│  │ [Rotate Key] [Test] [Disable] [Remove]                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Add Another Connector]                                   │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Connector Testing Interface
**Location**: Modal or dedicated page

**Features**:
- Test connector functionality
- For Stripe: Create test payment
- For Firebase: Test login
- For OneSignal: Send test notification
- Real-time test results
- Error debugging

**Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ Test Connector: Stripe                          [X]          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Test Type: [Create Payment Intent ▼]                       │
│                                                              │
│  Amount: [10.00] USD                                         │
│                                                              │
│  [Run Test]                                                  │
│                                                              │
│  Results:                                                    │
│  ✓ API key valid                                             │
│  ✓ Payment intent created (pi_test_123456)                   │
│  ✓ Amount confirmed: $10.00 USD                              │
│  ✓ Test completed in 842ms                                   │
│                                                              │
│  [Close]                                                     │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoints

#### List Connectors
```
GET /api/connectors
Response: { connectors: ConnectorDefinition[] }
```

#### Get Connector Details
```
GET /api/connectors/:id
Response: ConnectorDefinition
```

#### Add Connector to Project
```
POST /api/projects/:projectId/connectors
Body: { connectorId, config }
Response: { success, connectorInstance }
```

#### Update Connector Config
```
PATCH /api/projects/:projectId/connectors/:connectorId
Body: { config }
Response: { success }
```

#### Test Connector
```
POST /api/projects/:projectId/connectors/:connectorId/test
Response: { success, results }
```

#### Remove Connector
```
DELETE /api/projects/:projectId/connectors/:connectorId
Response: { success }
```

### Success Metrics
- Connector addition success rate > 98%
- Average time to add connector < 3 minutes
- Configuration error rate < 5%
- User satisfaction score > 4.5/5

---

## Configuration and Credential Management

### Secure Storage Architecture

#### Database Schema
```sql
CREATE TABLE connector_instances (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  connector_id VARCHAR(50) NOT NULL,

  -- Configuration (non-sensitive)
  config JSONB DEFAULT '{}',

  -- Encrypted credentials (sensitive)
  credentials_encrypted TEXT NOT NULL,
  encryption_key_id VARCHAR(100) NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'active',
  last_validated_at TIMESTAMP,
  validation_result JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_connector_instances_project ON connector_instances(project_id);
CREATE INDEX idx_connector_instances_connector ON connector_instances(connector_id);
```

#### Encryption Strategy
- **Algorithm**: AES-256-GCM
- **Key Management**: AWS KMS or similar
- **Key Rotation**: Automatic every 90 days
- **Access Control**: Only connector service can decrypt

```typescript
// packages/connectors/src/encryption.ts
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

export class CredentialEncryption {
  async encrypt(credentials: object): Promise<EncryptedCredentials> {
    const plaintext = JSON.stringify(credentials);
    const keyId = await this.getCurrentKeyId();

    const encrypted = await kms.send(new EncryptCommand({
      KeyId: keyId,
      Plaintext: Buffer.from(plaintext),
    }));

    return {
      ciphertext: encrypted.CiphertextBlob!.toString('base64'),
      keyId,
    };
  }

  async decrypt(encrypted: EncryptedCredentials): Promise<object> {
    const decrypted = await kms.send(new DecryptCommand({
      CiphertextBlob: Buffer.from(encrypted.ciphertext, 'base64'),
      KeyId: encrypted.keyId,
    }));

    return JSON.parse(decrypted.Plaintext!.toString());
  }
}
```

### Environment Variable Injection

Connectors inject credentials as environment variables in generated apps:

```
# .env (generated, gitignored)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...    # Server-only
FIREBASE_API_KEY=AIza...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
ONESIGNAL_APP_ID=abc123...
```

**Security Rules**:
1. Secret keys never exposed to client
2. Use Expo Secrets for production
3. `.env` files gitignored
4. Credentials rotatable from dashboard
5. Audit log of all credential access

### Credential Rotation

**Manual Rotation**:
1. User clicks "Rotate Credentials"
2. System marks old credentials as "expiring"
3. User provides new credentials
4. System validates new credentials
5. Code is updated with new values
6. Old credentials expire after 7 days

**Automatic Rotation** (OAuth):
1. System detects token expiration
2. Uses refresh token to get new access token
3. Updates stored credentials
4. Notifies user if refresh fails

---

## One-Click Setup Flow Requirements

### Design Principles
1. **Minimal Steps**: 3-5 clicks to add a connector
2. **Clear Feedback**: Show what's happening at each step
3. **Smart Defaults**: Pre-fill values when possible
4. **Error Recovery**: Clear error messages with fix suggestions
5. **Instant Validation**: Validate credentials before proceeding

### Flow Example: Stripe Connector

#### Step 1: Discovery (1 click)
```
User clicks "Add Stripe" in connector marketplace
```

#### Step 2: Authentication (1 click)
```
User clicks "Connect with Stripe" (OAuth)
→ Redirects to Stripe
→ User authorizes
→ Redirects back to Mobigen
```

#### Step 3: Configuration (Auto)
```
System auto-detects:
- Account ID
- Publishable key
- Secret key
- Webhook endpoint
No user input needed
```

#### Step 4: Feature Selection (1 click)
```
User sees:
☑ One-time payments (default)
☐ Subscriptions
☐ Apple Pay
☐ Google Pay

User checks desired features
Clicks "Enable"
```

#### Step 5: Code Injection (Auto)
```
AI agent:
1. Adds dependencies
2. Injects initialization code
3. Adds payment components
4. Updates checkout flow
5. Validates code compiles

Shows progress:
"Adding Stripe SDK... ✓"
"Creating payment service... ✓"
"Updating checkout screen... ✓"
"Testing integration... ✓"
```

#### Step 6: Verification (Auto + 1 click)
```
System:
- Creates test payment intent
- Shows "Test in preview" button

User:
- Clicks "Test in preview"
- QR code opens app
- Sees working payment form
- Completes test payment
- Success!
```

**Total**: 4 user clicks + 2-3 minutes

### Alternative Flow: Manual API Keys

For connectors without OAuth:

```
Step 1: User clicks "Add [Connector]"
Step 2: Modal shows input fields for API keys
Step 3: User pastes keys
Step 4: System validates keys
Step 5: If valid, proceed to feature selection
Step 6: Code injection (same as above)
```

**Total**: 3-4 user clicks + 2-3 minutes

---

## Success Metrics

### Quantitative Metrics

#### Adoption
- **Target**: 60% of projects use at least one connector
- **Measurement**: Connector usage rate by project
- **Goal**: Match Replit's connector usage (70%)

#### Setup Success Rate
- **Target**: 95% successful connector additions
- **Measurement**: (Successful adds / Total attempts) × 100
- **Failure reasons tracked**: Invalid credentials, API errors, code injection failures

#### Time to Setup
- **Target**: < 3 minutes average per connector
- **Measurement**: Time from "Add Connector" click to "Connector Active"
- **Breakdown by connector**: Stripe, Firebase, Supabase, etc.

#### Code Quality
- **Target**: 98% code injection success
- **Measurement**: Injected code compiles without errors
- **Test coverage**: All generated code has tests

#### Connector Reliability
- **Target**: 99.5% uptime for connector services
- **Measurement**: Connector service availability
- **SLA**: < 1 minute downtime per month

### Qualitative Metrics

#### User Satisfaction
- **Survey after connector addition**: "How easy was it to add this connector?"
- **Target**: 4.5/5 average rating
- **NPS for connectors**: Target +50

#### Developer Experience
- **Time to add new connector**: < 4 hours for developer
- **Code reusability**: 80% of code shared across connectors
- **Documentation clarity**: 90% find docs helpful

### Competitive Metrics

#### Feature Parity
| Metric | Target | Competitive Benchmark |
|--------|--------|----------------------|
| Number of connectors | 5 (MVP) → 15 (Phase 2) | Replit: 30+, Base44: 15+ |
| Setup time | < 3 min | Replit: ~2 min, Base44: ~5 min |
| Success rate | 95%+ | Replit: ~90%, Base44: ~85% |
| One-click setup | 80% of connectors | Replit: 70%, Base44: 60% |

---

## Dependencies and Risks

### External Dependencies

#### Third-Party APIs
| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| **Stripe API** | Medium | Rate limiting, API versioning, error handling |
| **Firebase API** | Medium | Quota limits, project setup complexity |
| **Supabase API** | Low | Well-documented, stable API |
| **RevenueCat API** | Low | Simple API, good SDK |
| **OneSignal API** | Low | Mature platform, stable API |

#### OAuth Providers
| Provider | Risk Level | Mitigation |
|----------|------------|------------|
| **Stripe Connect** | Low | Well-tested OAuth flow |
| **Google Cloud** | Medium | Firebase project selection complexity |
| **GitHub** (future) | Low | Standard OAuth 2.0 |

### Technical Dependencies

#### Internal Dependencies
- **Encryption Service**: Must be operational for credential storage
- **AI Generation Service**: Must inject code correctly
- **Testing Service**: Must validate injected code
- **S3/Storage**: Must store connector configurations

#### External Libraries
```json
{
  "@stripe/stripe-react-native": "^0.37.2",
  "@react-native-firebase/app": "^19.0.1",
  "@supabase/supabase-js": "^2.39.0",
  "react-native-purchases": "^7.0.0",
  "react-native-onesignal": "^5.0.0"
}
```

**Risks**:
- Breaking changes in library updates
- Native module build failures
- Expo compatibility issues

**Mitigation**:
- Pin library versions
- Test before updates
- Maintain compatibility matrix

### Business Risks

#### User Experience Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OAuth failure | High | Medium | Fallback to manual API key entry |
| Code injection conflict | High | Low | Careful injection point design |
| Credential leak | Critical | Low | Encryption, audit logs, security scanning |
| Connector downtime | Medium | Low | Status page, graceful degradation |

#### Competitive Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Replit adds more connectors | Medium | Focus on quality over quantity |
| Third-party changes pricing | Low | Pass costs to users, alternative connectors |
| New competitor with better connectors | Medium | Differentiate on mobile focus |

### Technical Risks

#### Code Injection Risks
**Risk**: Injected code overwrites user customizations
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Use merge strategies, not overwrites
  - Version control with rollback
  - User confirmation before injection

**Risk**: Connector conflicts with each other
- **Probability**: Low
- **Impact**: High
- **Mitigation**:
  - Isolated injection points
  - Dependency resolution
  - Integration tests with multiple connectors

#### Security Risks
**Risk**: Credentials exposed in generated code
- **Probability**: Low
- **Impact**: Critical
- **Mitigation**:
  - Environment variables only
  - Automated secret scanning
  - Code review before generation

**Risk**: Man-in-the-middle during OAuth
- **Probability**: Very Low
- **Impact**: Critical
- **Mitigation**:
  - HTTPS everywhere
  - PKCE for OAuth
  - State parameter validation

### Operational Risks

#### Support Risks
**Risk**: High support volume for connector setup
- **Probability**: High
- **Impact**: Medium
- **Mitigation**:
  - Comprehensive documentation
  - Video tutorials
  - In-app setup guides
  - Automated testing before user sees errors

**Risk**: Third-party service outages blamed on Mobigen
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Clear status indicators
  - External service status checks
  - "Test Connector" feature
  - Status page showing third-party status

---

## Implementation Plan

### Phase 1: Foundation (Days 1-2)
**Focus**: S3-01 Connector Framework Design

**Deliverables**:
- Connector definition schema
- Base connector class
- Encryption service
- Connector registry
- Database schema
- API endpoints

**Success Criteria**:
- Framework can register connectors
- Credentials encrypted/decrypted
- Basic UI shows connector list

### Phase 2: First Connector (Day 2-3)
**Focus**: S3-02 Stripe Connector

**Deliverables**:
- Stripe connector definition
- OAuth integration
- Code generators
- Payment components
- Testing interface

**Success Criteria**:
- Stripe OAuth works
- Code injection succeeds
- Test payment completes
- Preview shows payment form

### Phase 3: Additional Connectors (Days 3-4)
**Focus**: S3-03 Firebase, S3-04 Supabase, S3-05 RevenueCat, S3-06 OneSignal

**Deliverables**:
- Firebase connector with Auth + Firestore
- Supabase connector with Auth + Database
- RevenueCat connector for IAP
- OneSignal connector for push

**Success Criteria**:
- All 5 connectors functional
- Each passes integration tests
- Can enable multiple connectors
- No conflicts between connectors

### Phase 4: UI Polish (Day 4-5)
**Focus**: S3-07 Connector UI in Dashboard

**Deliverables**:
- Connector marketplace UI
- Configuration modals
- Active connectors view
- Testing interface
- Documentation

**Success Criteria**:
- UI matches designs
- All flows tested
- Documentation complete
- User can add connector in < 3 min

### Phase 5: Testing & Launch (Day 5)
**Focus**: Integration testing, bug fixes, documentation

**Deliverables**:
- End-to-end tests for all connectors
- Performance testing
- Security review
- User documentation
- Video tutorials

**Success Criteria**:
- All tests pass
- No critical bugs
- Documentation reviewed
- Ready for beta users

---

## Future Enhancements (Post-Sprint 3)

### Additional Connectors (Phase 2)
1. **Twilio** - SMS and voice
2. **Sendgrid** - Email delivery
3. **Sentry** - Error tracking
4. **Mixpanel** - Advanced analytics
5. **Algolia** - Search
6. **Cloudinary** - Image optimization
7. **Google Maps** - Maps and location
8. **Auth0** - Authentication
9. **Clerk** - Authentication
10. **Plaid** - Banking integrations

### Advanced Features
1. **Connector Marketplace** - Third-party connector submissions
2. **Custom Connectors** - User-defined connectors
3. **Connector Templates** - Boilerplate for new connectors
4. **A/B Testing** - Test connector configurations
5. **Usage Analytics** - Track connector performance
6. **Cost Estimation** - Estimate third-party costs
7. **Auto-Updates** - Keep connector libraries updated
8. **Conflict Resolution** - Smarter handling of overlapping connectors

### Enterprise Features
1. **SSO Integration** - SAML, OIDC
2. **Custom OAuth** - White-label OAuth flows
3. **Audit Logs** - Detailed connector activity logs
4. **Compliance** - SOC2, HIPAA connectors
5. **Multi-Region** - Region-specific connector instances

---

## Appendix A: Connector Definition Examples

### Example: Stripe Connector

```typescript
// packages/connectors/src/definitions/stripe.ts

import type { ConnectorDefinition } from '../types';

export const stripeConnector: ConnectorDefinition = {
  id: 'stripe',
  name: 'Stripe',
  description: 'Accept payments with credit cards, Apple Pay, and Google Pay',
  category: 'payments',
  logo: 'https://assets.mobigen.io/connectors/stripe.svg',

  authType: 'oauth',
  configSchema: {
    type: 'object',
    required: ['accountId', 'publishableKey', 'secretKey'],
    properties: {
      accountId: { type: 'string' },
      publishableKey: { type: 'string', pattern: '^pk_(test|live)_' },
      secretKey: { type: 'string', pattern: '^sk_(test|live)_' },
      webhookSecret: { type: 'string', pattern: '^whsec_' },
      currency: { type: 'string', default: 'USD' },
      paymentMethods: {
        type: 'array',
        items: { enum: ['card', 'apple_pay', 'google_pay'] },
        default: ['card'],
      },
      subscriptionEnabled: { type: 'boolean', default: false },
    },
  },

  capabilities: ['payments', 'subscriptions', 'refunds'],
  dependencies: [
    '@stripe/stripe-react-native@^0.37.2',
    'stripe@^14.10.0',
  ],

  codeGenerators: {
    dependencies: generateStripeDependencies,
    initialization: generateStripeInit,
    components: generateStripeComponents,
    services: generateStripeService,
    environment: generateStripeEnv,
  },

  validator: validateStripeConfig,

  docsUrl: 'https://docs.mobigen.io/connectors/stripe',
  setupGuideUrl: 'https://stripe.com/docs/connect',
};

async function validateStripeConfig(config: StripeConfig): Promise<ValidationResult> {
  try {
    // Test API keys
    const stripe = new Stripe(config.secretKey);
    const account = await stripe.accounts.retrieve();

    return {
      valid: true,
      message: `Connected to Stripe account: ${account.business_profile?.name}`,
      metadata: { accountId: account.id },
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid Stripe API keys',
      suggestion: 'Double-check your secret key from the Stripe dashboard',
    };
  }
}

function generateStripeInit(config: StripeConfig): string {
  return `
import { StripeProvider } from '@stripe/stripe-react-native';

// Wrap your app with StripeProvider
function App() {
  return (
    <StripeProvider publishableKey={process.env.STRIPE_PUBLISHABLE_KEY!}>
      {/* Your app content */}
    </StripeProvider>
  );
}
`.trim();
}
```

---

## Appendix B: API Specifications

### Connector Registry API

#### List All Connectors
```http
GET /api/v1/connectors
```

**Response**:
```json
{
  "connectors": [
    {
      "id": "stripe",
      "name": "Stripe",
      "description": "Accept payments...",
      "category": "payments",
      "logo": "https://...",
      "authType": "oauth",
      "capabilities": ["payments", "subscriptions"],
      "setupDifficulty": "easy"
    },
    // ...
  ]
}
```

#### Get Connector Details
```http
GET /api/v1/connectors/:id
```

**Response**:
```json
{
  "id": "stripe",
  "name": "Stripe",
  "description": "...",
  "configSchema": { /* JSON Schema */ },
  "documentation": "...",
  "setupGuide": "..."
}
```

### Project Connectors API

#### Add Connector to Project
```http
POST /api/v1/projects/:projectId/connectors
Content-Type: application/json

{
  "connectorId": "stripe",
  "config": {
    "accountId": "acct_...",
    "publishableKey": "pk_test_...",
    "secretKey": "sk_test_...",
    "currency": "USD",
    "paymentMethods": ["card", "apple_pay"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "connectorInstance": {
    "id": "uuid",
    "connectorId": "stripe",
    "status": "active",
    "createdAt": "2026-01-15T10:00:00Z"
  },
  "codeChanges": {
    "filesModified": 5,
    "filesAdded": 3,
    "summary": "Added Stripe payment integration"
  }
}
```

#### Test Connector
```http
POST /api/v1/projects/:projectId/connectors/:connectorId/test
Content-Type: application/json

{
  "testType": "payment_intent",
  "params": {
    "amount": 1000,
    "currency": "usd"
  }
}
```

**Response**:
```json
{
  "success": true,
  "results": {
    "duration": 842,
    "steps": [
      { "name": "API key validation", "passed": true },
      { "name": "Payment intent created", "passed": true, "details": "pi_test_123" },
      { "name": "Amount verified", "passed": true }
    ]
  }
}
```

---

## Document Status

**Status**: Draft - Ready for Review
**Version**: 1.0
**Author**: Product Team
**Reviewers**: Engineering, Design, Security
**Next Steps**:
1. Review and approval
2. Technical design document creation
3. Sprint kickoff

---

**Related Documents**:
- [Mobigen PRD](/home/ubuntu/base99/docs/PRD-mobigen.md)
- [Competitive Analysis](/home/ubuntu/base99/mobigen/docs/COMPETITIVE-ANALYSIS.md)
- [Project Status - Phase 4](/home/ubuntu/base99/mobigen/docs/PROJECT-STATUS-PHASE4.md)
- [Sprint 1: Quick Wins PRD](/home/ubuntu/base99/mobigen/docs/sprints/sprint-1-quick-wins/PRD.md)
- [Sprint 2: GitHub & TestFlight PRD](/home/ubuntu/base99/mobigen/docs/sprints/sprint-2-github-testflight/PRD.md)
