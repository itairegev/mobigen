# Firebase Connector for Mobigen

The Firebase connector provides seamless integration with Google Firebase services including Authentication, Firestore Database, and Cloud Storage.

## Features

### Authentication
- **Email/Password Authentication** - Traditional email and password sign-up/sign-in
- **Google Sign-In** - OAuth integration with Google accounts
- **Apple Sign-In** - OAuth integration with Apple accounts (iOS)
- **Password Reset** - Email-based password recovery
- **Profile Management** - Update display name, email, photo URL
- **Account Management** - Delete account functionality

### Firestore Database
- **CRUD Operations** - Create, read, update, delete documents
- **Real-time Sync** - Live data synchronization with React hooks
- **Query Builder** - Flexible querying with conditions, ordering, limits
- **Batch Operations** - Efficient batch writes
- **Transactions** - Atomic operations support
- **Offline Support** - Built-in offline persistence

### Cloud Storage
- File upload and download
- Progress tracking
- Metadata management
- URL generation

## Generated Files

When installed, this connector generates the following files in your project:

```
src/
├── services/
│   ├── firebase-config.ts       # Firebase initialization
│   ├── firebase-auth.ts         # Authentication service
│   └── firebase-firestore.ts    # Firestore service
├── hooks/
│   ├── use-firebase-auth.ts     # Auth React hooks
│   └── use-firestore.ts         # Firestore React hooks
└── types/
    └── firebase.ts              # TypeScript types
```

## Required Credentials

To install this connector, you'll need:

1. **API Key** - Firebase web API key (starts with `AIza`)
2. **Auth Domain** - Firebase auth domain (e.g., `my-app.firebaseapp.com`)
3. **Project ID** - Your Firebase project identifier
4. **Storage Bucket** - Cloud Storage bucket (e.g., `my-app.appspot.com`)
5. **Messaging Sender ID** - For Firebase Cloud Messaging
6. **App ID** - Firebase app identifier (starts with `1:`)

### How to Get Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → Project settings
4. Scroll to "Your apps" section
5. Click "Add app" → iOS or Android
6. Follow the setup wizard to get your credentials

All these values are found in the Firebase config object shown after app creation.

## Usage Examples

### Authentication

```typescript
import { useAuth, useSignIn, useSignUp } from './hooks/use-firebase-auth';

function LoginScreen() {
  const { signIn, loading, error } = useSignIn();

  const handleLogin = async () => {
    const result = await signIn('user@example.com', 'password123');
    if (result.success) {
      console.log('Logged in:', result.user);
    }
  };

  return (
    <View>
      <Button onPress={handleLogin} disabled={loading}>
        Sign In
      </Button>
      {error && <Text>{error.message}</Text>}
    </View>
  );
}

function App() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingScreen />;

  return isAuthenticated ? <HomeScreen /> : <LoginScreen />;
}
```

### Firestore

```typescript
import { useCollection, useMutation } from './hooks/use-firestore';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: any;
}

function PostList() {
  // Real-time collection sync
  const { data: posts, loading, error } = useCollection<Post>('posts', {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 20,
  });

  const { create, update, delete: deletePost } = useMutation<Post>('posts');

  const handleCreatePost = async () => {
    const result = await create({
      title: 'New Post',
      content: 'Hello world!',
      authorId: user.uid,
    });

    if (result.success) {
      console.log('Created post:', result.id);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <PostItem post={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Query with Conditions

```typescript
import { useQuery } from './hooks/use-firestore';

function MyPosts() {
  const { user } = useAuth();

  // Real-time query with where clause
  const { data: myPosts, loading } = useQuery<Post>(
    'posts',
    [
      { field: 'authorId', operator: '==', value: user.uid },
      { field: 'isPublished', operator: '==', value: true },
    ],
    {
      orderBy: { field: 'createdAt', direction: 'desc' },
    }
  );

  return <PostList posts={myPosts} />;
}
```

### Single Document

```typescript
import { useDocument, useUpdateDocument } from './hooks/use-firestore';

function PostDetail({ postId }: { postId: string }) {
  // Real-time document sync
  const { data: post, loading } = useDocument<Post>('posts', postId);
  const { update, loading: updating } = useUpdateDocument<Post>('posts');

  const handleLike = async () => {
    await update(postId, {
      likes: (post?.likes || 0) + 1,
    });
  };

  if (loading) return <LoadingSpinner />;
  if (!post) return <NotFound />;

  return (
    <View>
      <Text>{post.title}</Text>
      <Text>{post.content}</Text>
      <Button onPress={handleLike} disabled={updating}>
        Like ({post.likes})
      </Button>
    </View>
  );
}
```

## Offline Support

Firestore automatically enables offline persistence. Data is cached locally and synchronized when connectivity is restored.

```typescript
// Offline persistence is enabled by default in firebase-config.ts
await firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});
```

## Error Handling

All operations return user-friendly error messages:

```typescript
const { signIn, error } = useSignIn();

const result = await signIn(email, password);

if (!result.success) {
  // Error is automatically mapped to friendly message
  console.log(error?.message); // "Incorrect password" instead of "auth/wrong-password"
}
```

Common error codes are mapped to readable messages:
- `auth/email-already-in-use` → "This email is already registered"
- `auth/invalid-email` → "Invalid email address"
- `auth/user-not-found` → "No account found with this email"
- `auth/wrong-password` → "Incorrect password"
- `auth/weak-password` → "Password should be at least 6 characters"

## Security Rules

Don't forget to configure Firebase Security Rules for production:

### Firestore Rules Example

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Public read, authenticated write
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

### Storage Rules Example

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

## Additional Configuration

### Google Sign-In Setup (iOS)

Add to your `info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
    </array>
  </dict>
</array>
```

### Apple Sign-In Setup (iOS)

Enable the "Sign in with Apple" capability in Xcode:
1. Open your project in Xcode
2. Select your target
3. Go to "Signing & Capabilities"
4. Click "+ Capability"
5. Add "Sign in with Apple"

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase Docs](https://rnfirebase.io)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## Support

For issues or questions about this connector, please refer to the [Mobigen documentation](https://docs.mobigen.io) or contact support.
