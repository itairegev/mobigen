/**
 * Community Service - Persistent posts, members, and interactions
 *
 * Configuration:
 * - EXPO_PUBLIC_COMMUNITY_NAME: Name of the community
 * - EXPO_PUBLIC_COMMUNITY_API_URL: Optional external API endpoint
 * - EXPO_PUBLIC_ENABLE_MEMBER_POSTS: Allow member posts (default: true)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post, Comment, Reaction, ReactionType, Member } from '../types';
import { MOCK_MEMBERS } from './members';
import { MOCK_POSTS, MOCK_COMMENTS } from './posts';

// Configuration
const COMMUNITY_NAME = process.env.EXPO_PUBLIC_COMMUNITY_NAME || 'Our Community';
const API_URL = process.env.EXPO_PUBLIC_COMMUNITY_API_URL || '';
const ENABLE_MEMBER_POSTS = process.env.EXPO_PUBLIC_ENABLE_MEMBER_POSTS !== 'false';

// Storage keys
const STORAGE_KEYS = {
  POSTS: '@community/posts',
  COMMENTS: '@community/comments',
  USER_REACTIONS: '@community/userReactions',
  CURRENT_USER: '@community/currentUser',
  BOOKMARKS: '@community/bookmarks',
};

// In-memory cache
let cachedPosts: Post[] | null = null;
let cachedComments: Comment[] | null = null;

/**
 * Initialize posts from storage
 */
async function loadPosts(): Promise<Post[]> {
  if (cachedPosts) return cachedPosts;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedPosts = parsed.map((post: Post & { createdAt: string }) => ({
        ...post,
        createdAt: new Date(post.createdAt),
      }));
      return cachedPosts;
    }
  } catch (error) {
    console.error('Failed to load posts:', error);
  }

  // Initialize with mock data
  cachedPosts = MOCK_POSTS.map(post => ({
    ...post,
    createdAt: new Date(post.createdAt),
  }));
  await savePosts(cachedPosts);
  return cachedPosts;
}

/**
 * Save posts to storage
 */
async function savePosts(posts: Post[]): Promise<void> {
  cachedPosts = posts;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  } catch (error) {
    console.error('Failed to save posts:', error);
  }
}

/**
 * Load comments from storage
 */
async function loadComments(): Promise<Comment[]> {
  if (cachedComments) return cachedComments;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedComments = parsed.map((comment: Comment & { createdAt: string }) => ({
        ...comment,
        createdAt: new Date(comment.createdAt),
      }));
      return cachedComments;
    }
  } catch (error) {
    console.error('Failed to load comments:', error);
  }

  cachedComments = [...MOCK_COMMENTS];
  await saveComments(cachedComments);
  return cachedComments;
}

/**
 * Save comments to storage
 */
async function saveComments(comments: Comment[]): Promise<void> {
  cachedComments = comments;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  } catch (error) {
    console.error('Failed to save comments:', error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<Member> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
  }
  // Default to first member
  return MOCK_MEMBERS[0];
}

/**
 * Set current user
 */
export async function setCurrentUser(member: Member): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(member));
  } catch (error) {
    console.error('Failed to set current user:', error);
  }
}

/**
 * Get paginated posts with optional filters
 */
export async function getPosts(
  page: number = 1,
  limit: number = 10,
  options?: {
    authorId?: string;
    tier?: string;
    pinned?: boolean;
  }
): Promise<{ posts: Post[]; hasMore: boolean; total: number }> {
  let posts = await loadPosts();

  // Apply filters
  if (options?.authorId) {
    posts = posts.filter(p => p.authorId === options.authorId);
  }
  if (options?.tier) {
    posts = posts.filter(p => p.tier === options.tier);
  }
  if (options?.pinned !== undefined) {
    posts = posts.filter(p => p.pinned === options.pinned);
  }

  // Sort by pinned first, then by date
  posts.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const total = posts.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedPosts = posts.slice(start, end);

  return {
    posts: paginatedPosts,
    hasMore: end < total,
    total,
  };
}

/**
 * Get a single post by ID
 */
export async function getPost(id: string): Promise<Post | null> {
  const posts = await loadPosts();
  return posts.find(p => p.id === id) || null;
}

/**
 * Create a new post
 */
export async function createPost(
  content: string,
  images?: string[],
  options?: { tier?: string }
): Promise<Post> {
  if (!ENABLE_MEMBER_POSTS) {
    throw new Error('Member posts are disabled');
  }

  const posts = await loadPosts();
  const currentUser = await getCurrentUser();

  const newPost: Post = {
    id: `post-${Date.now()}`,
    authorId: currentUser.id,
    author: currentUser,
    content,
    images,
    createdAt: new Date(),
    reactions: [],
    commentCount: 0,
    pinned: false,
    tier: options?.tier,
  };

  posts.unshift(newPost);
  await savePosts(posts);

  return newPost;
}

/**
 * Update a post
 */
export async function updatePost(id: string, content: string): Promise<Post> {
  const posts = await loadPosts();
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    throw new Error('Post not found');
  }

  posts[index] = { ...posts[index], content };
  await savePosts(posts);

  return posts[index];
}

/**
 * Delete a post
 */
export async function deletePost(id: string): Promise<void> {
  const posts = await loadPosts();
  const filtered = posts.filter(p => p.id !== id);
  await savePosts(filtered);

  // Also delete associated comments
  const comments = await loadComments();
  const filteredComments = comments.filter(c => c.postId !== id);
  await saveComments(filteredComments);
}

/**
 * Toggle a reaction on a post
 */
export async function toggleReaction(
  postId: string,
  type: ReactionType
): Promise<void> {
  const posts = await loadPosts();
  const currentUser = await getCurrentUser();
  const post = posts.find(p => p.id === postId);

  if (!post) {
    throw new Error('Post not found');
  }

  const existingIndex = post.reactions.findIndex(
    r => r.userId === currentUser.id && r.type === type
  );

  if (existingIndex >= 0) {
    // Remove reaction
    post.reactions.splice(existingIndex, 1);
  } else {
    // Add reaction
    post.reactions.push({
      id: `reaction-${Date.now()}`,
      type,
      userId: currentUser.id,
      createdAt: new Date(),
    });
  }

  await savePosts(posts);
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<Comment[]> {
  const comments = await loadComments();
  return comments.filter(c => c.postId === postId).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, content: string): Promise<Comment> {
  const [comments, posts, currentUser] = await Promise.all([
    loadComments(),
    loadPosts(),
    getCurrentUser(),
  ]);

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    postId,
    authorId: currentUser.id,
    author: currentUser,
    content,
    createdAt: new Date(),
    reactions: [],
    replyCount: 0,
  };

  comments.push(newComment);
  await saveComments(comments);

  // Update post comment count
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.commentCount++;
    await savePosts(posts);
  }

  return newComment;
}

/**
 * Get all members
 */
export async function getMembers(): Promise<Member[]> {
  return MOCK_MEMBERS;
}

/**
 * Get member by ID
 */
export async function getMember(id: string): Promise<Member | null> {
  return MOCK_MEMBERS.find(m => m.id === id) || null;
}

/**
 * Toggle bookmark on a post
 */
export async function toggleBookmark(postId: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    let bookmarks: string[] = stored ? JSON.parse(stored) : [];

    const index = bookmarks.indexOf(postId);
    if (index >= 0) {
      bookmarks.splice(index, 1);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return false; // Unbookmarked
    } else {
      bookmarks.push(postId);
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return true; // Bookmarked
    }
  } catch (error) {
    console.error('Failed to toggle bookmark:', error);
    return false;
  }
}

/**
 * Get bookmarked post IDs
 */
export async function getBookmarks(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    return [];
  }
}

/**
 * Search posts
 */
export async function searchPosts(query: string): Promise<Post[]> {
  const posts = await loadPosts();
  const lowerQuery = query.toLowerCase();

  return posts.filter(
    p =>
      p.content.toLowerCase().includes(lowerQuery) ||
      p.author.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get community configuration
 */
export function getCommunityConfig() {
  return {
    name: COMMUNITY_NAME,
    enableMemberPosts: ENABLE_MEMBER_POSTS,
    hasExternalApi: !!API_URL,
  };
}

/**
 * Clear all community data (for testing)
 */
export async function clearCommunityData(): Promise<void> {
  cachedPosts = null;
  cachedComments = null;
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.POSTS),
    AsyncStorage.removeItem(STORAGE_KEYS.COMMENTS),
    AsyncStorage.removeItem(STORAGE_KEYS.USER_REACTIONS),
    AsyncStorage.removeItem(STORAGE_KEYS.BOOKMARKS),
  ]);
}
