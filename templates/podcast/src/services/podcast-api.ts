/**
 * Podcast API Service - Fetch episodes from RSS feeds
 *
 * Configuration:
 * - EXPO_PUBLIC_PODCAST_RSS_URL: The podcast's RSS feed URL
 * - EXPO_PUBLIC_PODCAST_MODE: 'rss' | 'demo' (default: 'demo')
 *
 * This service fetches and parses podcast RSS feeds, which is the standard
 * way podcasts are distributed and consumed.
 */

import { Episode, Series } from '../types';
import { MOCK_EPISODES, MOCK_SERIES } from './episodes';

// Configuration
const PODCAST_MODE = process.env.EXPO_PUBLIC_PODCAST_MODE || 'demo';
const PODCAST_RSS_URL = process.env.EXPO_PUBLIC_PODCAST_RSS_URL || '';
const PODCAST_NAME = process.env.EXPO_PUBLIC_PODCAST_NAME || 'My Podcast';
const PODCAST_IMAGE = process.env.EXPO_PUBLIC_PODCAST_IMAGE || '';

// Cache for fetched episodes
let cachedEpisodes: Episode[] | null = null;
let cachedSeries: Series | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Parse RSS feed XML and extract episodes
 */
async function parseRSSFeed(rssUrl: string): Promise<{ series: Series; episodes: Episode[] }> {
  try {
    // Fetch the RSS feed
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse RSS XML (simple regex-based parsing for React Native compatibility)
    const channelTitle = extractTag(xmlText, 'title') || PODCAST_NAME;
    const channelDescription = extractTag(xmlText, 'description') || '';
    const channelImage = extractTag(xmlText, 'itunes:image', 'href') ||
                         extractTag(xmlText, 'url', null, '<image>') ||
                         PODCAST_IMAGE;
    const channelCategory = extractTag(xmlText, 'itunes:category', 'text') || 'Podcast';

    // Extract items (episodes)
    const items = xmlText.split('<item>').slice(1);
    const episodes: Episode[] = items.map((item, index) => {
      const id = extractTag(item, 'guid') || `ep-${index + 1}`;
      const title = extractTag(item, 'title') || `Episode ${index + 1}`;
      const description = extractTag(item, 'description') ||
                         extractTag(item, 'itunes:summary') || '';
      const audioUrl = extractTag(item, 'enclosure', 'url') || '';
      const durationStr = extractTag(item, 'itunes:duration') || '0';
      const pubDate = extractTag(item, 'pubDate') || '';
      const imageUrl = extractTag(item, 'itunes:image', 'href') || channelImage;
      const episodeNum = parseInt(extractTag(item, 'itunes:episode') || '0');
      const seasonNum = parseInt(extractTag(item, 'itunes:season') || '1');

      return {
        id,
        seriesId: 'main-series',
        title: cleanHtml(title),
        description: cleanHtml(description).substring(0, 500),
        duration: parseDuration(durationStr),
        publishedAt: new Date(pubDate),
        audioUrl,
        imageUrl,
        showNotes: cleanHtml(description),
        exclusive: false,
        downloadable: true,
        playCount: 0,
        season: seasonNum,
        episodeNumber: episodeNum || (items.length - index),
      };
    });

    const series: Series = {
      id: 'main-series',
      name: cleanHtml(channelTitle),
      description: cleanHtml(channelDescription).substring(0, 300),
      imageUrl: channelImage,
      category: channelCategory,
      episodeCount: episodes.length,
    };

    return { series, episodes };
  } catch (error) {
    console.error('RSS Parse Error:', error);
    throw error;
  }
}

/**
 * Helper to extract content from XML tags
 */
function extractTag(xml: string, tagName: string, attr?: string | null, context?: string): string {
  let searchXml = xml;
  if (context) {
    const contextMatch = xml.match(new RegExp(`${context}[\\s\\S]*?</[^>]+>`));
    if (contextMatch) searchXml = contextMatch[0];
  }

  if (attr) {
    // Extract attribute value: <tag attr="value">
    const attrRegex = new RegExp(`<${tagName}[^>]*${attr}="([^"]*)"`, 'i');
    const match = searchXml.match(attrRegex);
    return match ? match[1] : '';
  }

  // Extract tag content: <tag>content</tag>
  const tagRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i');
  const cdataMatch = searchXml.match(tagRegex);
  if (cdataMatch) return cdataMatch[1];

  const simpleRegex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const simpleMatch = searchXml.match(simpleRegex);
  return simpleMatch ? simpleMatch[1] : '';
}

/**
 * Clean HTML entities and tags from text
 */
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Parse duration string to seconds
 * Handles: "1:30:00", "45:30", "3600", "01:30:00"
 */
function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;

  // Already in seconds
  if (!durationStr.includes(':')) {
    return parseInt(durationStr) || 0;
  }

  // HH:MM:SS or MM:SS format
  const parts = durationStr.split(':').map(p => parseInt(p) || 0);

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

/**
 * Fetch episodes - uses RSS if configured, otherwise mock data
 */
async function fetchPodcastData(): Promise<{ series: Series; episodes: Episode[] }> {
  // Check cache
  if (cachedEpisodes && cachedSeries && Date.now() - lastFetchTime < CACHE_DURATION) {
    return { series: cachedSeries, episodes: cachedEpisodes };
  }

  // Use RSS feed if configured
  if (PODCAST_MODE === 'rss' && PODCAST_RSS_URL) {
    try {
      const data = await parseRSSFeed(PODCAST_RSS_URL);
      cachedSeries = data.series;
      cachedEpisodes = data.episodes;
      lastFetchTime = Date.now();
      return data;
    } catch (error) {
      console.warn('Failed to fetch RSS, falling back to demo:', error);
      // Fall through to mock data
    }
  }

  // Return mock data
  return {
    series: MOCK_SERIES[0],
    episodes: MOCK_EPISODES,
  };
}

/**
 * Get all episodes
 */
export async function getAllEpisodes(): Promise<Episode[]> {
  const { episodes } = await fetchPodcastData();
  return [...episodes].sort((a, b) =>
    b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

/**
 * Get episode by ID
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  const { episodes } = await fetchPodcastData();
  return episodes.find(ep => ep.id === id) || null;
}

/**
 * Get episodes by series
 */
export async function getEpisodesBySeries(seriesId: string): Promise<Episode[]> {
  const { episodes } = await fetchPodcastData();
  return episodes
    .filter(ep => ep.seriesId === seriesId)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Get all series (in RSS mode, returns the main series)
 */
export async function getAllSeries(): Promise<Series[]> {
  const { series } = await fetchPodcastData();

  if (PODCAST_MODE === 'rss') {
    return [series];
  }

  return MOCK_SERIES;
}

/**
 * Search episodes
 */
export async function searchEpisodes(query: string): Promise<Episode[]> {
  const { episodes } = await fetchPodcastData();
  const lowerQuery = query.toLowerCase();

  return episodes.filter(ep =>
    ep.title.toLowerCase().includes(lowerQuery) ||
    ep.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get featured/latest episodes
 */
export async function getFeaturedEpisodes(limit: number = 5): Promise<Episode[]> {
  const { episodes } = await fetchPodcastData();
  return [...episodes]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
}

/**
 * Get exclusive episodes
 */
export async function getExclusiveEpisodes(): Promise<Episode[]> {
  const { episodes } = await fetchPodcastData();
  return episodes
    .filter(ep => ep.exclusive)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Get podcast info
 */
export async function getPodcastInfo(): Promise<Series> {
  const { series } = await fetchPodcastData();
  return series;
}

/**
 * Check if podcast is configured with real RSS
 */
export function isPodcastConfigured(): boolean {
  return PODCAST_MODE === 'rss' && !!PODCAST_RSS_URL;
}

/**
 * Clear cached data (useful after configuration changes)
 */
export function clearPodcastCache(): void {
  cachedEpisodes = null;
  cachedSeries = null;
  lastFetchTime = 0;
}
