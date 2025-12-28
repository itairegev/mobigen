/**
 * AI Assistant Template Schema
 */

import type { TemplateSchema } from './types';

export const aiAssistantSchema: TemplateSchema = {
  templateId: 'ai-assistant',
  tables: [
    {
      name: 'users',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'settings', type: 'map' },
        { name: 'usageCount', type: 'number', default: 0 },
        { name: 'lastActiveAt', type: 'string' },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'conversations',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'title', type: 'string' },
        { name: 'systemPrompt', type: 'string' },
        { name: 'model', type: 'string', default: 'gpt-4' },
        { name: 'messageCount', type: 'number', default: 0 },
        { name: 'tokenCount', type: 'number', default: 0 },
        { name: 'isArchived', type: 'boolean', default: false },
        { name: 'isPinned', type: 'boolean', default: false },
        { name: 'lastMessageAt', type: 'string' },
        { name: 'createdAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-user',
          partitionKey: { name: 'userId', type: 'S' },
          sortKey: { name: 'lastMessageAt', type: 'S' },
        },
      ],
    },
    {
      name: 'messages',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'conversationId', type: 'string', required: true },
        { name: 'role', type: 'string', required: true },
        { name: 'content', type: 'string', required: true },
        { name: 'tokenCount', type: 'number', default: 0 },
        { name: 'metadata', type: 'map' },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'prompts',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string' },
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string' },
        { name: 'content', type: 'string', required: true },
        { name: 'category', type: 'string' },
        { name: 'isPublic', type: 'boolean', default: false },
        { name: 'usageCount', type: 'number', default: 0 },
        { name: 'createdAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-category',
          partitionKey: { name: 'category', type: 'S' },
          sortKey: { name: 'usageCount', type: 'N' },
        },
      ],
    },
  ],
  seedData: {
    prompts: [
      {
        id: 'prompt-general',
        name: 'General Assistant',
        description: 'A helpful, harmless, and honest AI assistant',
        content: 'You are a helpful AI assistant. Answer questions accurately and concisely.',
        category: 'general',
        isPublic: true,
      },
      {
        id: 'prompt-creative',
        name: 'Creative Writer',
        description: 'An AI that helps with creative writing',
        content: 'You are a creative writing assistant. Help users with stories, poems, and creative content.',
        category: 'creative',
        isPublic: true,
      },
      {
        id: 'prompt-code',
        name: 'Code Helper',
        description: 'An AI that helps with programming',
        content: 'You are a programming assistant. Help users write, debug, and understand code.',
        category: 'technical',
        isPublic: true,
      },
    ],
  },
};
