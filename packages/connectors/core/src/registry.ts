/**
 * Global connector registry
 *
 * @packageDocumentation
 */

import type { ConnectorDefinition, ConnectorCategory, ConnectorTier } from './types';

/**
 * Global connector registry for managing available connectors.
 *
 * This singleton registry stores all registered connectors and provides
 * methods for discovery, filtering, and retrieval.
 *
 * @example
 * ```typescript
 * import { connectorRegistry } from '@mobigen/connectors/core';
 * import { StripeConnector } from '@mobigen/connectors/stripe';
 *
 * // Register a connector
 * connectorRegistry.register(new StripeConnector());
 *
 * // Get a connector
 * const stripe = connectorRegistry.get('stripe');
 *
 * // List all connectors
 * const all = connectorRegistry.list();
 *
 * // Filter by category
 * const payments = connectorRegistry.listByCategory('payments');
 *
 * // Search
 * const results = connectorRegistry.search('payment');
 * ```
 */
export class ConnectorRegistry {
  private connectors = new Map<string, ConnectorDefinition>();

  /**
   * Register a connector in the registry.
   *
   * @param connector - Connector definition to register
   * @throws Error if connector with same ID already registered
   *
   * @example
   * ```typescript
   * const stripe = new StripeConnector();
   * connectorRegistry.register(stripe);
   * ```
   */
  register(connector: ConnectorDefinition): void {
    if (this.connectors.has(connector.metadata.id)) {
      throw new Error(
        `Connector with ID '${connector.metadata.id}' is already registered`
      );
    }

    this.connectors.set(connector.metadata.id, connector);
  }

  /**
   * Get a connector by ID.
   *
   * @param id - Connector ID
   * @returns Connector definition or undefined if not found
   *
   * @example
   * ```typescript
   * const stripe = connectorRegistry.get('stripe');
   * if (stripe) {
   *   console.log(stripe.metadata.name); // 'Stripe'
   * }
   * ```
   */
  get(id: string): ConnectorDefinition | undefined {
    return this.connectors.get(id);
  }

  /**
   * Check if a connector is registered.
   *
   * @param id - Connector ID
   * @returns True if connector exists
   *
   * @example
   * ```typescript
   * if (connectorRegistry.has('stripe')) {
   *   // Stripe connector is available
   * }
   * ```
   */
  has(id: string): boolean {
    return this.connectors.has(id);
  }

  /**
   * List all registered connectors.
   *
   * @returns Array of all connector definitions
   *
   * @example
   * ```typescript
   * const all = connectorRegistry.list();
   * console.log(`${all.length} connectors available`);
   * ```
   */
  list(): ConnectorDefinition[] {
    return Array.from(this.connectors.values());
  }

  /**
   * List connectors by category.
   *
   * @param category - Category to filter by
   * @returns Array of matching connectors
   *
   * @example
   * ```typescript
   * const payments = connectorRegistry.listByCategory('payments');
   * // Returns: [StripeConnector, ...]
   * ```
   */
  listByCategory(category: ConnectorCategory | string): ConnectorDefinition[] {
    return this.list().filter((c) => c.metadata.category === category);
  }

  /**
   * List connectors by tier.
   *
   * @param tier - Tier to filter by
   * @returns Array of matching connectors
   *
   * @example
   * ```typescript
   * const free = connectorRegistry.listByTier('free');
   * // Returns all free connectors
   * ```
   */
  listByTier(tier: ConnectorTier | string): ConnectorDefinition[] {
    return this.list().filter((c) => c.metadata.tier === tier);
  }

  /**
   * Search connectors by name, description, or tags.
   *
   * @param query - Search query (case-insensitive)
   * @returns Array of matching connectors
   *
   * @example
   * ```typescript
   * const results = connectorRegistry.search('payment');
   * // Returns: [StripeConnector, RevenueCatConnector, ...]
   * ```
   */
  search(query: string): ConnectorDefinition[] {
    const lowerQuery = query.toLowerCase();

    return this.list().filter(
      (c) =>
        c.metadata.name.toLowerCase().includes(lowerQuery) ||
        c.metadata.description.toLowerCase().includes(lowerQuery) ||
        c.metadata.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get connectors by platform support.
   *
   * @param platform - Platform to filter by
   * @returns Array of connectors supporting the platform
   *
   * @example
   * ```typescript
   * const ios = connectorRegistry.listByPlatform('ios');
   * // Returns all connectors that support iOS
   * ```
   */
  listByPlatform(platform: 'ios' | 'android' | 'web'): ConnectorDefinition[] {
    return this.list().filter((c) => c.metadata.platforms.includes(platform));
  }

  /**
   * Get connector count.
   *
   * @returns Number of registered connectors
   */
  count(): number {
    return this.connectors.size;
  }

  /**
   * Unregister a connector.
   *
   * Useful for testing or hot-reloading during development.
   *
   * @param id - Connector ID to unregister
   * @returns True if connector was removed, false if not found
   *
   * @example
   * ```typescript
   * connectorRegistry.unregister('stripe');
   * ```
   */
  unregister(id: string): boolean {
    return this.connectors.delete(id);
  }

  /**
   * Clear all registered connectors.
   *
   * Warning: This removes all connectors from the registry.
   * Primarily useful for testing.
   */
  clear(): void {
    this.connectors.clear();
  }

  /**
   * Get all connector IDs.
   *
   * @returns Array of connector IDs
   */
  getIds(): string[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Get connectors grouped by category.
   *
   * @returns Map of category to connectors
   *
   * @example
   * ```typescript
   * const byCategory = connectorRegistry.groupByCategory();
   * console.log(byCategory.get('payments')); // [StripeConnector, ...]
   * ```
   */
  groupByCategory(): Map<string, ConnectorDefinition[]> {
    const grouped = new Map<string, ConnectorDefinition[]>();

    for (const connector of this.list()) {
      const category = connector.metadata.category;
      const existing = grouped.get(category) || [];
      existing.push(connector);
      grouped.set(category, existing);
    }

    return grouped;
  }
}

/**
 * Singleton connector registry instance.
 *
 * Use this instance throughout your application.
 */
export const connectorRegistry = new ConnectorRegistry();
