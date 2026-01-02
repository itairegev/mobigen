import { Post, Comment, Reaction, ReactionType } from '../types';
import { MOCK_MEMBERS } from './members';

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    authorId: '1',
    author: MOCK_MEMBERS[0],
    content: '🎉 Exciting news everyone! We just hit 1,000 members in our community! Thank you all for being part of this incredible journey. Your engagement, support, and creativity make this space truly special. Here\'s to the next milestone! 🚀',
    images: ['https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800'],
    createdAt: new Date('2024-01-01T10:00:00'),
    reactions: [
      { id: 'r1', type: 'celebrate', userId: '2', createdAt: new Date() },
      { id: 'r2', type: 'heart', userId: '3', createdAt: new Date() },
      { id: 'r3', type: 'like', userId: '4', createdAt: new Date() },
      { id: 'r4', type: 'celebrate', userId: '5', createdAt: new Date() },
    ],
    commentCount: 12,
    pinned: true,
  },
  {
    id: '2',
    authorId: '8',
    author: MOCK_MEMBERS[7],
    content: 'New podcast episode just dropped! 🎙️ This week we\'re diving deep into community building strategies with special guest @sarahj. Link in bio - would love to hear your thoughts!',
    createdAt: new Date('2024-01-01T14:30:00'),
    reactions: [
      { id: 'r5', type: 'fire', userId: '1', createdAt: new Date() },
      { id: 'r6', type: 'like', userId: '6', createdAt: new Date() },
    ],
    commentCount: 8,
    pinned: false,
  },
  {
    id: '3',
    authorId: '2',
    author: MOCK_MEMBERS[1],
    content: 'Just finished a 3-hour deep work session and feeling accomplished! 💪 What productivity techniques work best for you? Drop your favorites below - always looking to optimize my workflow.',
    createdAt: new Date('2024-01-01T16:45:00'),
    reactions: [
      { id: 'r7', type: 'fire', userId: '4', createdAt: new Date() },
      { id: 'r8', type: 'like', userId: '7', createdAt: new Date() },
      { id: 'r9', type: 'insightful', userId: '9', createdAt: new Date() },
    ],
    commentCount: 15,
    pinned: false,
  },
  {
    id: '4',
    authorId: '3',
    author: MOCK_MEMBERS[2],
    content: 'New design mockup for the community dashboard 🎨 What do you think? I went with a clean, minimal approach to let the content shine. Feedback welcome!',
    images: ['https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800'],
    createdAt: new Date('2024-01-01T18:20:00'),
    reactions: [
      { id: 'r10', type: 'heart', userId: '1', createdAt: new Date() },
      { id: 'r11', type: 'like', userId: '5', createdAt: new Date() },
      { id: 'r12', type: 'insightful', userId: '12', createdAt: new Date() },
    ],
    commentCount: 6,
    pinned: false,
  },
  {
    id: '5',
    authorId: '5',
    author: MOCK_MEMBERS[4],
    content: 'Quick tip for fellow marketers: The best content strategy is the one you can stick to consistently. Start small, measure results, iterate. Don\'t try to do everything at once! 📊',
    createdAt: new Date('2024-01-01T19:00:00'),
    reactions: [
      { id: 'r13', type: 'insightful', userId: '2', createdAt: new Date() },
      { id: 'r14', type: 'like', userId: '8', createdAt: new Date() },
    ],
    commentCount: 4,
    pinned: false,
    tier: 'supporter',
  },
  {
    id: '6',
    authorId: '9',
    author: MOCK_MEMBERS[8],
    content: 'Behind the scenes of my design process 👀 Sharing my Figma workflow and some tips I\'ve learned over the years. Hope this helps someone!',
    images: [
      'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800',
      'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800',
    ],
    createdAt: new Date('2024-01-01T20:15:00'),
    reactions: [
      { id: 'r15', type: 'fire', userId: '3', createdAt: new Date() },
      { id: 'r16', type: 'like', userId: '13', createdAt: new Date() },
    ],
    commentCount: 9,
    pinned: false,
  },
  {
    id: '7',
    authorId: '4',
    author: MOCK_MEMBERS[3],
    content: 'Coffee break thoughts ☕ Sometimes the best ideas come when you step away from the keyboard. What\'s your favorite way to recharge during the day?',
    createdAt: new Date('2024-01-02T09:30:00'),
    reactions: [
      { id: 'r17', type: 'heart', userId: '6', createdAt: new Date() },
      { id: 'r18', type: 'like', userId: '11', createdAt: new Date() },
    ],
    commentCount: 7,
    pinned: false,
  },
  {
    id: '8',
    authorId: '13',
    author: MOCK_MEMBERS[12],
    content: 'Captured this incredible sunset today 🌅 Nature is the best artist. Remember to look up from your screens once in a while!',
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
    createdAt: new Date('2024-01-02T11:45:00'),
    reactions: [
      { id: 'r19', type: 'heart', userId: '1', createdAt: new Date() },
      { id: 'r20', type: 'heart', userId: '7', createdAt: new Date() },
      { id: 'r21', type: 'like', userId: '14', createdAt: new Date() },
    ],
    commentCount: 5,
    pinned: false,
  },
  {
    id: '9',
    authorId: '18',
    author: MOCK_MEMBERS[17],
    content: 'Startup update: We just closed our seed round! 🎉 Couldn\'t have done it without this amazing community\'s support and feedback. Grateful for all of you. The journey continues!',
    createdAt: new Date('2024-01-02T13:00:00'),
    reactions: [
      { id: 'r22', type: 'celebrate', userId: '1', createdAt: new Date() },
      { id: 'r23', type: 'celebrate', userId: '8', createdAt: new Date() },
      { id: 'r24', type: 'fire', userId: '15', createdAt: new Date() },
    ],
    commentCount: 18,
    pinned: false,
    tier: 'premium',
  },
  {
    id: '10',
    authorId: '15',
    author: MOCK_MEMBERS[14],
    content: 'Business tip of the day: Your network is your net worth. Invest in relationships, not just transactions. The best opportunities come from genuine connections. 🤝',
    createdAt: new Date('2024-01-02T15:20:00'),
    reactions: [
      { id: 'r25', type: 'insightful', userId: '2', createdAt: new Date() },
      { id: 'r26', type: 'like', userId: '18', createdAt: new Date() },
    ],
    commentCount: 11,
    pinned: false,
  },
  {
    id: '11',
    authorId: '10',
    author: MOCK_MEMBERS[9],
    content: 'Morning workout complete! 💪 Starting the day with movement sets the tone for everything else. Who else is prioritizing fitness this year?',
    createdAt: new Date('2024-01-02T16:30:00'),
    reactions: [
      { id: 'r27', type: 'fire', userId: '20', createdAt: new Date() },
      { id: 'r28', type: 'like', userId: '16', createdAt: new Date() },
    ],
    commentCount: 3,
    pinned: false,
  },
  {
    id: '12',
    authorId: '19',
    author: MOCK_MEMBERS[18],
    content: 'Social media strategy insight: Authenticity > Perfection. People connect with real stories and genuine personalities. Don\'t be afraid to show the messy middle! ✨',
    createdAt: new Date('2024-01-02T17:45:00'),
    reactions: [
      { id: 'r29', type: 'insightful', userId: '5', createdAt: new Date() },
      { id: 'r30', type: 'heart', userId: '17', createdAt: new Date() },
    ],
    commentCount: 8,
    pinned: false,
  },
  {
    id: '13',
    authorId: '6',
    author: MOCK_MEMBERS[5],
    content: 'Just shipped a new feature! 🚀 The feeling never gets old. Shoutout to the dev community for being an endless source of knowledge and inspiration.',
    createdAt: new Date('2024-01-02T19:00:00'),
    reactions: [
      { id: 'r31', type: 'celebrate', userId: '2', createdAt: new Date() },
      { id: 'r32', type: 'fire', userId: '12', createdAt: new Date() },
    ],
    commentCount: 6,
    pinned: false,
  },
  {
    id: '14',
    authorId: '12',
    author: MOCK_MEMBERS[11],
    content: 'Data visualization of the week 📊 Analyzing community growth patterns over the past 6 months. The results might surprise you! Full analysis in the comments.',
    images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'],
    createdAt: new Date('2024-01-02T20:30:00'),
    reactions: [
      { id: 'r33', type: 'insightful', userId: '15', createdAt: new Date() },
      { id: 'r34', type: 'like', userId: '19', createdAt: new Date() },
    ],
    commentCount: 10,
    pinned: false,
    tier: 'premium',
  },
  {
    id: '15',
    authorId: '20',
    author: MOCK_MEMBERS[19],
    content: 'Life coaching moment: You don\'t have to have it all figured out. Progress is better than perfection. Take it one step at a time, and celebrate the small wins! 🌈',
    createdAt: new Date('2024-01-02T21:15:00'),
    reactions: [
      { id: 'r35', type: 'heart', userId: '7', createdAt: new Date() },
      { id: 'r36', type: 'heart', userId: '11', createdAt: new Date() },
      { id: 'r37', type: 'insightful', userId: '14', createdAt: new Date() },
    ],
    commentCount: 5,
    pinned: false,
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    postId: '1',
    authorId: '2',
    author: MOCK_MEMBERS[1],
    content: 'Congrats on this amazing milestone! 🎉',
    createdAt: new Date('2024-01-01T10:15:00'),
    reactions: [{ id: 'cr1', type: 'like', userId: '1', createdAt: new Date() }],
    replyCount: 0,
  },
  {
    id: 'c2',
    postId: '1',
    authorId: '3',
    author: MOCK_MEMBERS[2],
    content: 'So proud to be part of this community! Here\'s to many more 🚀',
    createdAt: new Date('2024-01-01T10:20:00'),
    reactions: [],
    replyCount: 0,
  },
];

export async function getPosts(page: number = 1, limit: number = 10): Promise<Post[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const start = (page - 1) * limit;
  const end = start + limit;
  return MOCK_POSTS.slice(start, end);
}

export async function getPost(id: string): Promise<Post | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_POSTS.find((post) => post.id === id) || null;
}

export async function getComments(postId: string): Promise<Comment[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_COMMENTS.filter((comment) => comment.postId === postId);
}

export async function createPost(content: string, images?: string[]): Promise<Post> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const newPost: Post = {
    id: Date.now().toString(),
    authorId: '1',
    author: MOCK_MEMBERS[0],
    content,
    images,
    createdAt: new Date(),
    reactions: [],
    commentCount: 0,
    pinned: false,
  };
  MOCK_POSTS.unshift(newPost);
  return newPost;
}

export async function toggleReaction(
  postId: string,
  type: ReactionType,
  userId: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const post = MOCK_POSTS.find((p) => p.id === postId);
  if (post) {
    const existingIndex = post.reactions.findIndex(
      (r) => r.userId === userId && r.type === type
    );
    if (existingIndex >= 0) {
      post.reactions.splice(existingIndex, 1);
    } else {
      post.reactions.push({
        id: Date.now().toString(),
        type,
        userId,
        createdAt: new Date(),
      });
    }
  }
}
