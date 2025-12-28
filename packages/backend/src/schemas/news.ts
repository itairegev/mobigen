/**
 * News & Content Template Schema
 */

import type { TemplateSchema } from './types';

export const newsSchema: TemplateSchema = {
  templateId: 'news',
  tables: [
    {
      name: 'articles',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'slug', type: 'string' },
        { name: 'excerpt', type: 'string' },
        { name: 'content', type: 'string', required: true },
        { name: 'imageUrl', type: 'string' },
        { name: 'categoryId', type: 'string' },
        { name: 'authorId', type: 'string' },
        { name: 'tags', type: 'list' },
        { name: 'status', type: 'string', default: 'draft' },
        { name: 'publishedAt', type: 'string' },
        { name: 'viewCount', type: 'number', default: 0 },
        { name: 'createdAt', type: 'string' },
        { name: 'updatedAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-category',
          partitionKey: { name: 'categoryId', type: 'S' },
          sortKey: { name: 'publishedAt', type: 'S' },
        },
        {
          name: 'by-status',
          partitionKey: { name: 'status', type: 'S' },
          sortKey: { name: 'publishedAt', type: 'S' },
        },
      ],
    },
    {
      name: 'categories',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'slug', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'imageUrl', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'sortOrder', type: 'number', default: 0 },
        { name: 'isActive', type: 'boolean', default: true },
      ],
    },
    {
      name: 'bookmarks',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'articleId', type: 'string', required: true },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'users',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'preferences', type: 'map' },
        { name: 'notificationsEnabled', type: 'boolean', default: true },
        { name: 'createdAt', type: 'string' },
      ],
    },
  ],
  seedData: {
    categories: [
      { id: 'cat-breaking', name: 'Breaking News', color: '#EF4444', sortOrder: 0 },
      { id: 'cat-tech', name: 'Technology', color: '#3B82F6', sortOrder: 1 },
      { id: 'cat-business', name: 'Business', color: '#10B981', sortOrder: 2 },
      { id: 'cat-sports', name: 'Sports', color: '#F59E0B', sortOrder: 3 },
    ],
  },
};
