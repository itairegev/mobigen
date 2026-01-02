import { Sermon, Series } from '../types';

export const MOCK_SERIES: Series[] = [
  {
    id: '1',
    name: 'The Gospel of John',
    description: 'An in-depth study through the Gospel of John, exploring the life and ministry of Jesus Christ.',
    thumbnail: 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?w=800',
    sermonCount: 12,
    startDate: new Date('2024-01-07'),
    endDate: new Date('2024-03-31'),
  },
  {
    id: '2',
    name: 'Living with Purpose',
    description: 'Discovering God\'s purpose for your life and walking in His calling.',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
    sermonCount: 6,
    startDate: new Date('2024-04-07'),
    endDate: new Date('2024-05-19'),
  },
  {
    id: '3',
    name: 'Faith in Action',
    description: 'Practical teachings on living out your faith in everyday life.',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    sermonCount: 8,
    startDate: new Date('2024-06-02'),
  },
];

export const MOCK_SERMONS: Sermon[] = [
  {
    id: '1',
    title: 'The Word Became Flesh',
    speaker: 'Pastor James Wilson',
    seriesId: '1',
    date: new Date('2024-01-07'),
    description: 'Exploring John 1:1-14 and the incarnation of Jesus Christ.',
    videoUrl: 'https://example.com/sermons/1.mp4',
    audioUrl: 'https://example.com/sermons/1.mp3',
    duration: 42,
    thumbnail: 'https://images.unsplash.com/photo-1505682634904-d7c8d95cdc50?w=800',
    scripture: 'John 1:1-14',
    notes: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
  },
  {
    id: '2',
    title: 'Behold the Lamb of God',
    speaker: 'Pastor James Wilson',
    seriesId: '1',
    date: new Date('2024-01-14'),
    description: 'John the Baptist\'s testimony about Jesus as the Lamb of God who takes away the sin of the world.',
    videoUrl: 'https://example.com/sermons/2.mp4',
    audioUrl: 'https://example.com/sermons/2.mp3',
    duration: 38,
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800',
    scripture: 'John 1:29-34',
  },
  {
    id: '3',
    title: 'Come and See',
    speaker: 'Pastor Sarah Mitchell',
    seriesId: '1',
    date: new Date('2024-01-21'),
    description: 'The first disciples encounter Jesus and respond to His invitation to "come and see."',
    videoUrl: 'https://example.com/sermons/3.mp4',
    audioUrl: 'https://example.com/sermons/3.mp3',
    duration: 45,
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    scripture: 'John 1:35-51',
  },
  {
    id: '4',
    title: 'The Wedding at Cana',
    speaker: 'Pastor James Wilson',
    seriesId: '1',
    date: new Date('2024-01-28'),
    description: 'Jesus performs His first miracle, turning water into wine at a wedding celebration.',
    videoUrl: 'https://example.com/sermons/4.mp4',
    audioUrl: 'https://example.com/sermons/4.mp3',
    duration: 40,
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    scripture: 'John 2:1-11',
  },
  {
    id: '5',
    title: 'You Must Be Born Again',
    speaker: 'Pastor Sarah Mitchell',
    seriesId: '1',
    date: new Date('2024-02-04'),
    description: 'Jesus\' nighttime conversation with Nicodemus about spiritual rebirth.',
    videoUrl: 'https://example.com/sermons/5.mp4',
    audioUrl: 'https://example.com/sermons/5.mp3',
    duration: 43,
    thumbnail: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800',
    scripture: 'John 3:1-21',
  },
  {
    id: '6',
    title: 'Living Water',
    speaker: 'Pastor James Wilson',
    seriesId: '1',
    date: new Date('2024-02-11'),
    description: 'Jesus meets the Samaritan woman at the well and offers her living water.',
    videoUrl: 'https://example.com/sermons/6.mp4',
    audioUrl: 'https://example.com/sermons/6.mp3',
    duration: 47,
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    scripture: 'John 4:1-42',
  },
  {
    id: '7',
    title: 'Finding Your Calling',
    speaker: 'Pastor David Chen',
    seriesId: '2',
    date: new Date('2024-04-07'),
    description: 'Understanding how God has uniquely created you for a specific purpose.',
    videoUrl: 'https://example.com/sermons/7.mp4',
    audioUrl: 'https://example.com/sermons/7.mp3',
    duration: 35,
    thumbnail: 'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=800',
    scripture: 'Jeremiah 29:11, Ephesians 2:10',
  },
  {
    id: '8',
    title: 'Walking in Your Purpose',
    speaker: 'Pastor David Chen',
    seriesId: '2',
    date: new Date('2024-04-14'),
    description: 'Practical steps to live out God\'s purpose for your life every day.',
    videoUrl: 'https://example.com/sermons/8.mp4',
    audioUrl: 'https://example.com/sermons/8.mp3',
    duration: 40,
    thumbnail: 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=800',
    scripture: 'Proverbs 3:5-6, Romans 12:1-2',
  },
  {
    id: '9',
    title: 'Love Your Neighbor',
    speaker: 'Pastor Sarah Mitchell',
    seriesId: '3',
    date: new Date('2024-06-02'),
    description: 'Putting the second greatest commandment into practice in our daily lives.',
    videoUrl: 'https://example.com/sermons/9.mp4',
    audioUrl: 'https://example.com/sermons/9.mp3',
    duration: 38,
    thumbnail: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
    scripture: 'Mark 12:31, Luke 10:25-37',
  },
  {
    id: '10',
    title: 'Faith and Works',
    speaker: 'Pastor James Wilson',
    seriesId: '3',
    date: new Date('2024-06-09'),
    description: 'Understanding the relationship between genuine faith and good works.',
    videoUrl: 'https://example.com/sermons/10.mp4',
    audioUrl: 'https://example.com/sermons/10.mp3',
    duration: 41,
    thumbnail: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800',
    scripture: 'James 2:14-26',
  },
  {
    id: '11',
    title: 'Forgiving Others',
    speaker: 'Pastor David Chen',
    seriesId: '3',
    date: new Date('2024-06-16'),
    description: 'The power of forgiveness and how it transforms our relationships.',
    videoUrl: 'https://example.com/sermons/11.mp4',
    audioUrl: 'https://example.com/sermons/11.mp3',
    duration: 36,
    thumbnail: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?w=800',
    scripture: 'Matthew 18:21-35, Colossians 3:13',
  },
  {
    id: '12',
    title: 'Serving with Joy',
    speaker: 'Pastor Sarah Mitchell',
    seriesId: '3',
    date: new Date('2024-06-23'),
    description: 'Finding joy in serving God and others through acts of kindness and service.',
    videoUrl: 'https://example.com/sermons/12.mp4',
    audioUrl: 'https://example.com/sermons/12.mp3',
    duration: 39,
    thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    scripture: 'Galatians 5:13, 1 Peter 4:10',
  },
];

// Simulated API functions
export async function getSeries(): Promise<Series[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_SERIES];
}

export async function getSermonsBySeries(seriesId: string): Promise<Sermon[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_SERMONS.filter((sermon) => sermon.seriesId === seriesId);
}

export async function getRecentSermons(limit: number = 5): Promise<Sermon[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_SERMONS]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export async function getSermonById(id: string): Promise<Sermon | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_SERMONS.find((sermon) => sermon.id === id) || null;
}
