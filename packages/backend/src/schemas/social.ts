/**
 * Social/Community Template Schema
 */

import type { TemplateSchema } from './types';

export const socialSchema: TemplateSchema = {
  templateId: 'social',
  tables: [
    {
      name: 'users',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'username', type: 'string', required: true },
        { name: 'email', type: 'string' },
        { name: 'displayName', type: 'string' },
        { name: 'bio', type: 'string' },
        { name: 'avatarUrl', type: 'string' },
        { name: 'coverUrl', type: 'string' },
        { name: 'followersCount', type: 'number', default: 0 },
        { name: 'followingCount', type: 'number', default: 0 },
        { name: 'postsCount', type: 'number', default: 0 },
        { name: 'isVerified', type: 'boolean', default: false },
        { name: 'isPrivate', type: 'boolean', default: false },
        { name: 'createdAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-username',
          partitionKey: { name: 'username', type: 'S' },
        },
      ],
    },
    {
      name: 'posts',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'content', type: 'string' },
        { name: 'mediaUrls', type: 'list' },
        { name: 'mediaType', type: 'string' },
        { name: 'likesCount', type: 'number', default: 0 },
        { name: 'commentsCount', type: 'number', default: 0 },
        { name: 'sharesCount', type: 'number', default: 0 },
        { name: 'isPublic', type: 'boolean', default: true },
        { name: 'hashtags', type: 'list' },
        { name: 'mentions', type: 'list' },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'comments',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'postId', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'content', type: 'string', required: true },
        { name: 'parentId', type: 'string' },
        { name: 'likesCount', type: 'number', default: 0 },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'follows',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'followerId', type: 'string', required: true },
        { name: 'followingId', type: 'string', required: true },
        { name: 'status', type: 'string', default: 'active' },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'likes',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'targetType', type: 'string', required: true },
        { name: 'targetId', type: 'string', required: true },
        { name: 'createdAt', type: 'string' },
      ],
    },
  ],
};
