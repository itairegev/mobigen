# Firebase Connector - Usage Examples

This document provides comprehensive examples for using the Firebase connector in your Mobigen app.

## Table of Contents

1. [Setup](#setup)
2. [Authentication Examples](#authentication-examples)
3. [Firestore Database Examples](#firestore-database-examples)
4. [Advanced Patterns](#advanced-patterns)
5. [Error Handling](#error-handling)
6. [Offline Support](#offline-support)

---

## Setup

After installing the Firebase connector, initialize it in your app's entry point:

```typescript
// App.tsx
import { useEffect } from 'react';
import { initializeFirebase } from './services/firebase-config';

export default function App() {
  useEffect(() => {
    // Initialize Firebase when app starts
    initializeFirebase()
      .then(() => console.log('Firebase initialized'))
      .catch((error) => console.error('Firebase init failed:', error));
  }, []);

  return <YourAppContent />;
}
```

---

## Authentication Examples

### Email/Password Sign Up

```typescript
import { View, TextInput, Button, Text } from 'react-native';
import { useState } from 'react';
import { useSignUp } from './hooks/use-firebase-auth';

function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const { signUp, loading, error } = useSignUp();

  const handleSignUp = async () => {
    const result = await signUp(email, password, displayName);

    if (result.success) {
      // User is now signed in
      console.log('Welcome,', result.user?.displayName);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Signing up...' : 'Sign Up'}
        onPress={handleSignUp}
        disabled={loading}
      />
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
    </View>
  );
}
```

### Email/Password Sign In

```typescript
import { useSignIn } from './hooks/use-firebase-auth';

function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useSignIn();

  const handleSignIn = async () => {
    const result = await signIn(email, password);

    if (result.success) {
      // Navigate to home screen
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Signing in...' : 'Sign In'}
        onPress={handleSignIn}
        disabled={loading}
      />
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
    </View>
  );
}
```

### Google Sign-In

```typescript
import { useGoogleSignIn } from './hooks/use-firebase-auth';

function SocialSignInButtons() {
  const { signInWithGoogle, loading, error } = useGoogleSignIn();

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();

    if (result.success) {
      console.log('Signed in with Google:', result.user?.email);
    }
  };

  return (
    <View>
      <Button
        title="Sign in with Google"
        onPress={handleGoogleSignIn}
        disabled={loading}
      />
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
    </View>
  );
}
```

### Apple Sign-In (iOS only)

```typescript
import { Platform } from 'react-native';
import { useAppleSignIn } from './hooks/use-firebase-auth';

function AppleSignInButton() {
  const { signInWithApple, loading, error } = useAppleSignIn();

  // Only show on iOS
  if (Platform.OS !== 'ios') return null;

  const handleAppleSignIn = async () => {
    const result = await signInWithApple();

    if (result.success) {
      console.log('Signed in with Apple:', result.user?.email);
    }
  };

  return (
    <Button
      title="Sign in with Apple"
      onPress={handleAppleSignIn}
      disabled={loading}
    />
  );
}
```

### Auth State Management

```typescript
import { useAuth } from './hooks/use-firebase-auth';

function AppNavigator() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  return (
    <View>
      <Text>Welcome, {user?.displayName || user?.email}!</Text>
      <AppTabs />
    </View>
  );
}
```

### Sign Out

```typescript
import { useSignOut } from './hooks/use-firebase-auth';

function SettingsScreen() {
  const { signOut, loading } = useSignOut();

  const handleSignOut = async () => {
    const result = await signOut();

    if (result.success) {
      // User is signed out, will show login screen
    }
  };

  return (
    <Button
      title="Sign Out"
      onPress={handleSignOut}
      disabled={loading}
    />
  );
}
```

### Password Reset

```typescript
import { usePasswordReset } from './hooks/use-firebase-auth';

function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const { sendPasswordResetEmail, loading, error, emailSent } = usePasswordReset();

  const handleResetPassword = async () => {
    const result = await sendPasswordResetEmail(email);

    if (result.success) {
      alert('Password reset email sent! Check your inbox.');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Button
        title="Send Reset Email"
        onPress={handleResetPassword}
        disabled={loading || emailSent}
      />
      {emailSent && <Text style={{ color: 'green' }}>Email sent!</Text>}
      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
    </View>
  );
}
```

---

## Firestore Database Examples

### Create Document

```typescript
import { useCreateDocument } from './hooks/use-firestore';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: any;
}

function CreatePostScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const { create, loading, error } = useCreateDocument<Post>('posts');

  const handleCreatePost = async () => {
    const result = await create({
      title,
      content,
      authorId: user!.uid,
    });

    if (result.success) {
      console.log('Created post with ID:', result.id);
      // Navigate back or clear form
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="Content"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <Button
        title="Create Post"
        onPress={handleCreatePost}
        disabled={loading}
      />
      {error && <Text>{error.message}</Text>}
    </View>
  );
}
```

### Read Collection (Real-time)

```typescript
import { useCollection } from './hooks/use-firestore';
import { FlatList } from 'react-native';

function PostListScreen() {
  const { data: posts, loading, error } = useCollection<Post>('posts', {
    orderBy: { field: 'createdAt', direction: 'desc' },
    limit: 20,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>{item.content}</Text>
        </View>
      )}
    />
  );
}
```

### Read Single Document (Real-time)

```typescript
import { useDocument } from './hooks/use-firestore';

function PostDetailScreen({ postId }: { postId: string }) {
  const { data: post, loading, error } = useDocument<Post>('posts', postId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!post) return <Text>Post not found</Text>;

  return (
    <View>
      <Text style={{ fontSize: 24 }}>{post.title}</Text>
      <Text>{post.content}</Text>
    </View>
  );
}
```

### Update Document

```typescript
import { useUpdateDocument } from './hooks/use-firestore';

function EditPostScreen({ postId }: { postId: string }) {
  const { data: post } = useDocument<Post>('posts', postId);
  const { update, loading, error } = useUpdateDocument<Post>('posts');

  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');

  const handleUpdatePost = async () => {
    const result = await update(postId, { title, content });

    if (result.success) {
      // Navigate back
    }
  };

  return (
    <View>
      <TextInput value={title} onChangeText={setTitle} />
      <TextInput value={content} onChangeText={setContent} multiline />
      <Button
        title="Update Post"
        onPress={handleUpdatePost}
        disabled={loading}
      />
      {error && <Text>{error.message}</Text>}
    </View>
  );
}
```

### Delete Document

```typescript
import { useDeleteDocument } from './hooks/use-firestore';

function PostActions({ postId }: { postId: string }) {
  const { delete: deletePost, loading, error } = useDeleteDocument<Post>('posts');

  const handleDeletePost = async () => {
    const confirmed = await confirm('Delete this post?');
    if (!confirmed) return;

    const result = await deletePost(postId);

    if (result.success) {
      // Navigate back
    }
  };

  return (
    <Button
      title="Delete Post"
      onPress={handleDeletePost}
      disabled={loading}
      color="red"
    />
  );
}
```

### Query with Conditions

```typescript
import { useQuery } from './hooks/use-firestore';

function MyPostsScreen() {
  const { user } = useAuth();

  // Get posts where authorId == current user's ID
  const { data: myPosts, loading } = useQuery<Post>(
    'posts',
    [
      { field: 'authorId', operator: '==', value: user!.uid },
    ],
    {
      orderBy: { field: 'createdAt', direction: 'desc' },
    }
  );

  return (
    <FlatList
      data={myPosts}
      renderItem={({ item }) => <PostItem post={item} />}
    />
  );
}
```

### Multiple Conditions Query

```typescript
function PublishedPostsByCategory({ category }: { category: string }) {
  const { data: posts, loading } = useQuery<Post>(
    'posts',
    [
      { field: 'category', operator: '==', value: category },
      { field: 'isPublished', operator: '==', value: true },
    ],
    {
      orderBy: { field: 'publishedAt', direction: 'desc' },
      limit: 10,
    }
  );

  return <PostList posts={posts} loading={loading} />;
}
```

### Batch Operations (useMutation)

```typescript
import { useMutation } from './hooks/use-firestore';

function PostManager() {
  const { create, update, delete: deletePost, loading, error } = useMutation<Post>('posts');

  const handleBulkActions = async () => {
    // Create a new post
    const createResult = await create({
      title: 'New Post',
      content: 'Content here',
      authorId: user!.uid,
    });

    if (createResult.success) {
      const postId = createResult.id!;

      // Update it
      await update(postId, { title: 'Updated Title' });

      // Or delete it
      // await deletePost(postId);
    }
  };

  return (
    <Button
      title="Perform Actions"
      onPress={handleBulkActions}
      disabled={loading}
    />
  );
}
```

### Paginated List

```typescript
import { usePaginatedQuery } from './hooks/use-firestore';

function InfinitePostList() {
  const {
    data: posts,
    loading,
    hasMore,
    loadMore,
  } = usePaginatedQuery<Post>('posts', 10, 'createdAt', 'desc');

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <PostItem post={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? <LoadingSpinner /> : hasMore ? null : <Text>No more posts</Text>
      }
    />
  );
}
```

---

## Advanced Patterns

### Like Button with Optimistic Updates

```typescript
function LikeButton({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { data: post } = useDocument<Post>('posts', postId);
  const { update } = useUpdateDocument<Post>('posts');

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    // Update Firestore
    const result = await update(postId, {
      likes: isLiked ? (post?.likes || 0) - 1 : (post?.likes || 0) + 1,
    });

    if (!result.success) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  return (
    <Button
      title={`${isLiked ? '❤️' : '🤍'} ${likeCount}`}
      onPress={handleLike}
    />
  );
}
```

### Subcollections

```typescript
// Comments subcollection under posts
function PostComments({ postId }: { postId: string }) {
  const { data: comments, loading } = useCollection<Comment>(
    `posts/${postId}/comments`,
    {
      orderBy: { field: 'createdAt', direction: 'asc' },
    }
  );

  const { create } = useCreateDocument<Comment>(`posts/${postId}/comments`);

  const handleAddComment = async (content: string) => {
    await create({
      content,
      authorId: user!.uid,
      postId,
    });
  };

  return (
    <View>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
      <CommentForm onSubmit={handleAddComment} />
    </View>
  );
}
```

### Search with Array Contains

```typescript
function PostsByTag({ tag }: { tag: string }) {
  const { data: posts } = useQuery<Post>(
    'posts',
    [
      { field: 'tags', operator: 'array-contains', value: tag },
    ],
    {
      limit: 20,
    }
  );

  return <PostList posts={posts} />;
}
```

---

## Error Handling

### Global Error Handler

```typescript
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<FirestoreError | AuthError | null>(null);

  if (error) {
    return (
      <View>
        <Text>Something went wrong</Text>
        <Text>{error.message}</Text>
        <Button title="Retry" onPress={() => setError(null)} />
      </View>
    );
  }

  return children;
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const result = await withRetry(() => create({ title: 'Post' }));
```

---

## Offline Support

Firestore automatically handles offline scenarios:

```typescript
function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('_connectivity')
      .doc('test')
      .onSnapshot(
        () => setIsOnline(true),
        () => setIsOnline(false)
      );

    return () => unsubscribe();
  }, []);

  if (!isOnline) {
    return <Text>📡 Offline - Changes will sync when connected</Text>;
  }

  return null;
}
```

### Manual Offline Mode

```typescript
import { firestore } from './services/firebase-config';

// Enable/disable network
await firestore().disableNetwork();
// ... work offline
await firestore().enableNetwork();
```

---

For more examples and patterns, see the [Firebase Documentation](https://firebase.google.com/docs) and [React Native Firebase Docs](https://rnfirebase.io).
