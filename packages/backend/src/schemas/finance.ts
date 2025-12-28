/**
 * Finance/Budget Tracking Template Schema
 */

import type { TemplateSchema } from './types';

export const financeSchema: TemplateSchema = {
  templateId: 'finance',
  tables: [
    {
      name: 'users',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'email', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'currency', type: 'string', default: 'USD' },
        { name: 'settings', type: 'map' },
        { name: 'createdAt', type: 'string' },
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
        { name: 'amount', type: 'number', required: true },
        { name: 'categoryId', type: 'string' },
        { name: 'accountId', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'date', type: 'string', required: true },
        { name: 'isRecurring', type: 'boolean', default: false },
        { name: 'recurringId', type: 'string' },
        { name: 'tags', type: 'list' },
        { name: 'attachmentUrl', type: 'string' },
        { name: 'createdAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-category',
          partitionKey: { name: 'categoryId', type: 'S' },
          sortKey: { name: 'date', type: 'S' },
        },
        {
          name: 'by-date',
          partitionKey: { name: 'userId', type: 'S' },
          sortKey: { name: 'date', type: 'S' },
        },
      ],
    },
    {
      name: 'categories',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string' },
        { name: 'name', type: 'string', required: true },
        { name: 'type', type: 'string', required: true },
        { name: 'icon', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'isSystem', type: 'boolean', default: false },
        { name: 'parentId', type: 'string' },
      ],
    },
    {
      name: 'budgets',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'spent', type: 'number', default: 0 },
        { name: 'categoryId', type: 'string' },
        { name: 'period', type: 'string', default: 'monthly' },
        { name: 'startDate', type: 'string' },
        { name: 'endDate', type: 'string' },
        { name: 'isActive', type: 'boolean', default: true },
        { name: 'alertThreshold', type: 'number', default: 80 },
      ],
    },
    {
      name: 'accounts',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'type', type: 'string', required: true },
        { name: 'balance', type: 'number', default: 0 },
        { name: 'currency', type: 'string', default: 'USD' },
        { name: 'color', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'isActive', type: 'boolean', default: true },
        { name: 'institution', type: 'string' },
      ],
    },
  ],
  seedData: {
    categories: [
      { id: 'cat-income', name: 'Income', type: 'income', icon: 'wallet', color: '#10B981', isSystem: true },
      { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#F59E0B', isSystem: true },
      { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'car', color: '#3B82F6', isSystem: true },
      { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#EC4899', isSystem: true },
      { id: 'cat-bills', name: 'Bills & Utilities', type: 'expense', icon: 'receipt', color: '#8B5CF6', isSystem: true },
      { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'film', color: '#EF4444', isSystem: true },
    ],
  },
};
