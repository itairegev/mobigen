# Changelog

All notable changes to the Firebase connector will be documented in this file.

## [1.0.0] - 2026-01-04

### Added

#### Core Connector
- **FirebaseConnector class** implementing BaseConnector interface
- Complete credential validation with 6 required fields:
  - API Key (with `AIza` prefix validation)
  - Auth Domain (must include `.firebaseapp.com`)
  - Project ID
  - Storage Bucket (must include `.appspot.com`)
  - Messaging Sender ID (numeric validation)
  - App ID (must start with `1:`)
- Connection testing via Firebase REST API
- Automatic dependency injection for React Native Firebase packages

#### Authentication Service (`firebase-auth.ts`)
- Email/password sign-in and sign-up
- Google Sign-In integration
- Apple Sign-In integration (iOS)
- Password reset functionality
- User profile updates (display name, email, password, photo URL)
- Account deletion
- Auth state listener with automatic cleanup
- Comprehensive error mapping to user-friendly messages

#### Authentication Hooks (`use-firebase-auth.ts`)
- `useAuth()` - Auth state management with automatic subscription
- `useSignIn()` - Email/password sign-in
- `useSignUp()` - Email/password sign-up with display name
- `useGoogleSignIn()` - Google OAuth integration
- `useAppleSignIn()` - Apple OAuth integration
- `useSignOut()` - Sign out with cleanup
- `usePasswordReset()` - Password reset email
- `useUpdateProfile()` - Update user profile
- `useUpdateEmail()` - Update user email
- `useUpdatePassword()` - Update user password
- `useDeleteAccount()` - Delete user account

#### Firestore Service (`firebase-firestore.ts`)
- **Generic FirestoreService<T> class** for type-safe CRUD operations
- Create documents with auto-generated IDs
- Set documents with specific IDs
- Get single documents by ID
- Get all documents with ordering and limits
- Query documents with multiple conditions
- Update documents
- Delete documents
- Real-time document snapshots
- Real-time collection snapshots
- Real-time query snapshots
- Batch write operations
- Transaction support
- Automatic timestamp fields (createdAt, updatedAt)

#### Firestore Hooks (`use-firestore.ts`)
- `useDocument()` - Real-time single document sync
- `useCollection()` - Real-time collection sync with ordering and limits
- `useQuery()` - Real-time query with multiple conditions
- `useCreateDocument()` - Create documents with loading/error states
- `useUpdateDocument()` - Update documents with loading/error states
- `useDeleteDocument()` - Delete documents with loading/error states
- `useMutation()` - Combined create/update/delete operations
- `usePaginatedQuery()` - Infinite scroll pagination support

#### TypeScript Types (`firebase-types.ts`)
- `FirebaseUser` - Complete user profile type
- `AuthError` - Authentication error type
- `FirestoreError` - Firestore error type
- `StorageError` - Storage error type
- `FirebaseDocument` - Base document with timestamps
- `QueryOptions` - Query configuration
- `WhereCondition` - Query condition type
- `BatchOperation` - Batch write operation type
- `UploadProgress` - File upload progress
- `UploadResult` - File upload result
- Example types for common collections (UserProfile, Post, Comment, Notification)

#### Configuration (`firebase-config.ts`)
- Firebase initialization with environment variable support
- Firestore offline persistence configuration
- Singleton pattern for Firebase app instance
- Helper functions for accessing Firebase services
- Error handling for initialization failures

#### Documentation
- Comprehensive README with setup instructions
- Detailed EXAMPLES.md with real-world usage patterns
- Credential acquisition guide with Firebase Console instructions
- Security rules examples for Firestore and Storage
- Platform-specific setup (Google Sign-In, Apple Sign-In)

#### Package Configuration
- Package.json with proper dependencies
- TypeScript configuration
- .gitignore for standard Node.js projects
- Changelog for version tracking

### Features

#### Offline Support
- Automatic offline persistence for Firestore
- Unlimited cache size by default
- Automatic sync when connectivity restored

#### Error Handling
- User-friendly error messages
- Automatic error mapping for common auth errors
- Consistent error types across all operations
- Original error preservation for debugging

#### Real-time Capabilities
- Automatic subscription management
- Cleanup on component unmount
- Live data synchronization
- Support for complex queries with real-time updates

#### Type Safety
- Full TypeScript support
- Generic types for collections
- Strict type checking
- IntelliSense support

### Dependencies

#### Production
- `@react-native-firebase/app` ^18.0.0
- `@react-native-firebase/auth` ^18.0.0
- `@react-native-firebase/firestore` ^18.0.0
- `@react-native-firebase/storage` ^18.0.0
- `@mobigen/connectors-core` (workspace)
- `zod` ^3.22.0

#### Development
- `@types/node` ^20.0.0
- `typescript` ^5.3.0
- `eslint` ^8.55.0
- `jest` ^29.7.0

### File Structure

```
packages/connectors/firebase/
├── src/
│   ├── index.ts                         # Main connector class
│   └── templates/
│       ├── index.ts                     # Template exports
│       ├── firebase-config.ts           # Config template
│       ├── firebase-auth.ts             # Auth service template
│       ├── use-firebase-auth.ts         # Auth hooks template
│       ├── firebase-firestore.ts        # Firestore service template
│       ├── use-firestore.ts             # Firestore hooks template
│       └── firebase-types.ts            # Types template
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── EXAMPLES.md
└── CHANGELOG.md
```

### Generated Files (when installed)

When the Firebase connector is installed in a Mobigen project, it generates:

```
src/
├── services/
│   ├── firebase-config.ts
│   ├── firebase-auth.ts
│   └── firebase-firestore.ts
├── hooks/
│   ├── use-firebase-auth.ts
│   └── use-firestore.ts
└── types/
    └── firebase.ts
```

### Security Considerations

- Credentials encrypted at rest using AES-256-GCM
- API keys validated before storage
- Environment variable support for production credentials
- Never logs decrypted credentials
- Follows Firebase security best practices

### Known Limitations

- Apple Sign-In only supported on iOS
- Requires React Native Firebase native setup
- Storage service templates not included in v1.0.0 (auth and Firestore only)
- No Firebase Cloud Messaging integration (planned for v1.1.0)

### Testing

- Connection test validates project existence
- Credential format validation using Zod schemas
- Warning system for mismatched project IDs in credentials

---

## Future Roadmap

### [1.1.0] - Planned
- Firebase Cloud Messaging (push notifications)
- Cloud Storage service and hooks
- Firebase Analytics integration
- Remote Config support

### [1.2.0] - Planned
- Firebase Cloud Functions integration
- Dynamic Links support
- Performance Monitoring
- Crashlytics integration

### [2.0.0] - Planned
- Firebase ML Kit integration
- Firebase Extensions support
- Admin SDK for server-side operations
- Advanced security rules generator
