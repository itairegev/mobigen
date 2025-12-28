/**
 * Loyalty & Rewards Template Schema
 */

import type { TemplateSchema } from './types';

export const loyaltySchema: TemplateSchema = {
  templateId: 'loyalty',
  tables: [
    {
      name: 'users',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'email', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'pointsBalance', type: 'number', default: 0 },
        { name: 'lifetimePoints', type: 'number', default: 0 },
        { name: 'tier', type: 'string', default: 'bronze' },
        { name: 'memberSince', type: 'string' },
        { name: 'lastVisit', type: 'string' },
        { name: 'createdAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-tier',
          partitionKey: { name: 'tier', type: 'S' },
          sortKey: { name: 'pointsBalance', type: 'N' },
        },
      ],
    },
    {
      name: 'rewards',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string' },
        { name: 'pointsCost', type: 'number', required: true },
        { name: 'imageUrl', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'isActive', type: 'boolean', default: true },
        { name: 'quantity', type: 'number', default: -1 },
        { name: 'expiresAt', type: 'string' },
        { name: 'terms', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-category',
          partitionKey: { name: 'category', type: 'S' },
          sortKey: { name: 'pointsCost', type: 'N' },
        },
      ],
    },
    {
      name: 'transactions',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'type', type: 'string', required: true },
        { name: 'points', type: 'number', required: true },
        { name: 'description', type: 'string' },
        { name: 'rewardId', type: 'string' },
        { name: 'referenceId', type: 'string' },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'tiers',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'minPoints', type: 'number', required: true },
        { name: 'multiplier', type: 'number', default: 1 },
        { name: 'benefits', type: 'list' },
        { name: 'color', type: 'string' },
        { name: 'iconUrl', type: 'string' },
      ],
    },
  ],
  seedData: {
    tiers: [
      { id: 'tier-bronze', name: 'Bronze', minPoints: 0, multiplier: 1, color: '#CD7F32' },
      { id: 'tier-silver', name: 'Silver', minPoints: 500, multiplier: 1.25, color: '#C0C0C0' },
      { id: 'tier-gold', name: 'Gold', minPoints: 2000, multiplier: 1.5, color: '#FFD700' },
      { id: 'tier-platinum', name: 'Platinum', minPoints: 5000, multiplier: 2, color: '#E5E4E2' },
    ],
  },
};
