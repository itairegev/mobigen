/**
 * Mobigen Analytics SDK
 *
 * Core analytics client for tracking events, screens, and user properties
 * in Mobigen-generated mobile apps.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import type {
  AnalyticsConfig,
  AnalyticsEvent,
  EventProperties,
  UserTraits,
  SessionInfo,
  EventContext,
  AnalyticsPlugin,
} from './types';

const STORAGE_KEY_PREFIX = '@mobigen_analytics';
const STORAGE_KEY_ANONYMOUS_ID = `${STORAGE_KEY_PREFIX}/anonymous_id`;
const STORAGE_KEY_USER_ID = `${STORAGE_KEY_PREFIX}/user_id`;
const STORAGE_KEY_SESSION = `${STORAGE_KEY_PREFIX}/session`;
const STORAGE_KEY_QUEUE = `${STORAGE_KEY_PREFIX}/queue`;

const DEFAULT_CONFIG = {
  endpoint: 'https://analytics.mobigen.io/v1/events',
  autoTrack: {
    screens: true,
    taps: false,
    errors: true,
    performance: false,
    sessions: true,
  },
  debug: false,
  maxQueueSize: 1000,
  flushInterval: 30000, // 30 seconds
  maxBatchSize: 50,
};

export class MobigenAnalytics {
  private static instance: MobigenAnalytics | null = null;

  private config: Required<AnalyticsConfig>;
  private anonymousId: string | null = null;
  private userId: string | null = null;
  private session: SessionInfo | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private initialized = false;
  private plugins: AnalyticsPlugin[] = [];

  private constructor() {
    this.config = DEFAULT_CONFIG as Required<AnalyticsConfig>;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MobigenAnalytics {
    if (!MobigenAnalytics.instance) {
      MobigenAnalytics.instance = new MobigenAnalytics();
    }
    return MobigenAnalytics.instance;
  }

  /**
   * Initialize analytics SDK
   */
  async init(config: AnalyticsConfig): Promise<void> {
    if (this.initialized) {
      this.log('Analytics already initialized');
      return;
    }

    this.config = { ...DEFAULT_CONFIG, ...config } as Required<AnalyticsConfig>;

    // Load or generate anonymous ID
    this.anonymousId = await this.getOrCreateAnonymousId();

    // Load persisted user ID
    this.userId = await this.getPersistedUserId();

    // Load or create session
    if (this.config.autoTrack.sessions) {
      await this.startOrResumeSession();
    }

    // Load queued events
    await this.loadQueue();

    // Start flush timer
    this.startFlushTimer();

    this.initialized = true;
    this.log('Analytics initialized', {
      projectId: this.config.projectId,
      anonymousId: this.anonymousId,
      userId: this.userId,
    });

    // Track app opened
    if (this.config.autoTrack.sessions) {
      this.track('app_opened', {
        is_first_launch: await this.isFirstLaunch(),
      });
    }
  }

  /**
   * Track a custom event
   */
  async track(eventName: string, properties?: EventProperties): Promise<void> {
    if (!this.initialized) {
      this.log('Analytics not initialized. Call init() first.');
      return;
    }

    const event = await this.createEvent('track', eventName, properties);
    await this.enqueueEvent(event);

    // Notify plugins
    for (const plugin of this.plugins) {
      if (plugin.track) {
        await plugin.track(event);
      }
    }

    this.log('Tracked event:', eventName, properties);
  }

  /**
   * Track a screen view
   */
  async screen(screenName: string, properties?: EventProperties): Promise<void> {
    if (!this.initialized || !this.config.autoTrack.screens) {
      return;
    }

    const event = await this.createEvent('screen', screenName, properties);
    await this.enqueueEvent(event);

    // Notify plugins
    for (const plugin of this.plugins) {
      if (plugin.screen) {
        await plugin.screen(screenName, properties);
      }
    }

    this.log('Tracked screen:', screenName, properties);
  }

  /**
   * Identify a user
   */
  async identify(userId: string, traits?: UserTraits): Promise<void> {
    if (!this.initialized) {
      this.log('Analytics not initialized. Call init() first.');
      return;
    }

    this.userId = userId;
    await AsyncStorage.setItem(STORAGE_KEY_USER_ID, userId);

    const event = await this.createEvent('identify', userId, traits);
    await this.enqueueEvent(event);

    // Notify plugins
    for (const plugin of this.plugins) {
      if (plugin.identify) {
        await plugin.identify(userId, traits);
      }
    }

    this.log('Identified user:', userId, traits);
  }

  /**
   * Set user properties (alias for identify without userId change)
   */
  async setUserProperties(properties: UserTraits): Promise<void> {
    if (!this.userId) {
      this.log('No user identified. Call identify() first.');
      return;
    }

    await this.identify(this.userId, properties);
  }

  /**
   * Reset user identity (logout)
   */
  async reset(): Promise<void> {
    this.userId = null;
    this.session = null;
    await AsyncStorage.removeItem(STORAGE_KEY_USER_ID);
    await AsyncStorage.removeItem(STORAGE_KEY_SESSION);

    this.log('User identity reset');
  }

  /**
   * Force flush queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    this.log('Flushing events:', this.eventQueue.length);

    const batch = this.eventQueue.splice(0, this.config.maxBatchSize);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          events: batch,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }

      // Save remaining queue
      await this.saveQueue();

      this.log('Events flushed successfully');
    } catch (error) {
      this.log('Error flushing events:', error);

      // Re-add batch to queue
      this.eventQueue.unshift(...batch);
      await this.saveQueue();
    }
  }

  /**
   * Register a plugin
   */
  addPlugin(plugin: AnalyticsPlugin): void {
    this.plugins.push(plugin);
    this.log('Plugin registered:', plugin.name);
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get anonymous ID
   */
  getAnonymousId(): string | null {
    return this.anonymousId;
  }

  /**
   * Get current session
   */
  getSession(): SessionInfo | null {
    return this.session;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Private methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private async createEvent(
    type: AnalyticsEvent['type'],
    name: string,
    properties?: EventProperties
  ): Promise<AnalyticsEvent> {
    const context = await this.getEventContext();

    return {
      id: this.generateEventId(),
      type,
      name,
      properties: properties || {},
      userId: this.userId || undefined,
      anonymousId: this.anonymousId!,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private async enqueueEvent(event: AnalyticsEvent): Promise<void> {
    this.eventQueue.push(event);

    // Update session
    if (this.session) {
      this.session.lastActivityAt = event.timestamp;
      this.session.eventCount++;
      await this.saveSession();
    }

    // Enforce max queue size
    if (this.eventQueue.length > this.config.maxQueueSize) {
      this.eventQueue.shift();
    }

    await this.saveQueue();

    // Flush if batch size reached
    if (this.eventQueue.length >= this.config.maxBatchSize) {
      await this.flush();
    }
  }

  private async getEventContext(): Promise<EventContext> {
    return {
      app: {
        name: Application.applicationName || 'Unknown',
        version: Application.nativeApplicationVersion || '0.0.0',
        build: Application.nativeBuildVersion || '0',
        namespace: Application.applicationId || 'unknown',
      },
      device: {
        id: this.anonymousId!,
        manufacturer: Constants.deviceName,
        model: Constants.deviceName,
        name: Constants.deviceName,
        type: Platform.OS,
      },
      os: {
        name: Platform.OS,
        version: Platform.Version.toString(),
      },
      locale: 'en-US', // TODO: Get from Localization
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private async getOrCreateAnonymousId(): Promise<string> {
    let id = await AsyncStorage.getItem(STORAGE_KEY_ANONYMOUS_ID);

    if (!id) {
      id = this.generateAnonymousId();
      await AsyncStorage.setItem(STORAGE_KEY_ANONYMOUS_ID, id);
    }

    return id;
  }

  private async getPersistedUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEY_USER_ID);
  }

  private async startOrResumeSession(): Promise<void> {
    const savedSession = await AsyncStorage.getItem(STORAGE_KEY_SESSION);

    if (savedSession) {
      const parsed: SessionInfo = JSON.parse(savedSession);
      const lastActivity = new Date(parsed.lastActivityAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastActivity.getTime()) / 1000 / 60;

      // Resume if last activity was within 30 minutes
      if (diffMinutes < 30) {
        this.session = parsed;
        this.log('Resumed session:', this.session.sessionId);
        return;
      }
    }

    // Create new session
    this.session = {
      sessionId: this.generateSessionId(),
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      eventCount: 0,
    };

    await this.saveSession();
    this.log('Started new session:', this.session.sessionId);
  }

  private async saveSession(): Promise<void> {
    if (this.session) {
      await AsyncStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(this.session));
    }
  }

  private async loadQueue(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_QUEUE);
      if (saved) {
        this.eventQueue = JSON.parse(saved);
        this.log('Loaded queued events:', this.eventQueue.length);
      }
    } catch (error) {
      this.log('Error loading queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      this.log('Error saving queue:', error);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async isFirstLaunch(): Promise<boolean> {
    const key = `${STORAGE_KEY_PREFIX}/has_launched`;
    const hasLaunched = await AsyncStorage.getItem(key);

    if (!hasLaunched) {
      await AsyncStorage.setItem(key, 'true');
      return true;
    }

    return false;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private generateAnonymousId(): string {
    return `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[Mobigen Analytics] ${message}`, ...args);
    }
  }
}

// Export singleton instance methods
export const init = (config: AnalyticsConfig) => MobigenAnalytics.getInstance().init(config);
export const track = (eventName: string, properties?: EventProperties) =>
  MobigenAnalytics.getInstance().track(eventName, properties);
export const screen = (screenName: string, properties?: EventProperties) =>
  MobigenAnalytics.getInstance().screen(screenName, properties);
export const identify = (userId: string, traits?: UserTraits) =>
  MobigenAnalytics.getInstance().identify(userId, traits);
export const setUserProperties = (properties: UserTraits) =>
  MobigenAnalytics.getInstance().setUserProperties(properties);
export const reset = () => MobigenAnalytics.getInstance().reset();
export const flush = () => MobigenAnalytics.getInstance().flush();
export const addPlugin = (plugin: AnalyticsPlugin) =>
  MobigenAnalytics.getInstance().addPlugin(plugin);
export const getUserId = () => MobigenAnalytics.getInstance().getUserId();
export const getAnonymousId = () => MobigenAnalytics.getInstance().getAnonymousId();
export const getSession = () => MobigenAnalytics.getInstance().getSession();
