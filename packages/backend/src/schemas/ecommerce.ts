/**
 * E-commerce Template Schema
 */

import type { TemplateSchema } from './types';

export const ecommerceSchema: TemplateSchema = {
  templateId: 'ecommerce',
  tables: [
    {
      name: 'products',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string' },
        { name: 'price', type: 'number', required: true },
        { name: 'compareAtPrice', type: 'number' },
        { name: 'imageUrl', type: 'string' },
        { name: 'images', type: 'list' },
        { name: 'categoryId', type: 'string' },
        { name: 'inventory', type: 'number', default: 0 },
        { name: 'isActive', type: 'boolean', default: true },
        { name: 'tags', type: 'list' },
        { name: 'createdAt', type: 'string' },
        { name: 'updatedAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-category',
          partitionKey: { name: 'categoryId', type: 'S' },
          sortKey: { name: 'createdAt', type: 'S' },
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
        { name: 'description', type: 'string' },
        { name: 'imageUrl', type: 'string' },
        { name: 'parentId', type: 'string' },
        { name: 'sortOrder', type: 'number', default: 0 },
        { name: 'isActive', type: 'boolean', default: true },
      ],
    },
    {
      name: 'orders',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'items', type: 'list', required: true },
        { name: 'subtotal', type: 'number', required: true },
        { name: 'tax', type: 'number', default: 0 },
        { name: 'shipping', type: 'number', default: 0 },
        { name: 'total', type: 'number', required: true },
        { name: 'status', type: 'string', default: 'pending' },
        { name: 'shippingAddress', type: 'map' },
        { name: 'billingAddress', type: 'map' },
        { name: 'paymentMethod', type: 'string' },
        { name: 'notes', type: 'string' },
        { name: 'createdAt', type: 'string' },
        { name: 'updatedAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-status',
          partitionKey: { name: 'status', type: 'S' },
          sortKey: { name: 'createdAt', type: 'S' },
        },
      ],
    },
    {
      name: 'users',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'email', type: 'string', required: true },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'addresses', type: 'list' },
        { name: 'createdAt', type: 'string' },
      ],
    },
  ],
  seedData: {
    categories: [
      { id: 'cat-featured', name: 'Featured', sortOrder: 0 },
      { id: 'cat-new', name: 'New Arrivals', sortOrder: 1 },
      { id: 'cat-sale', name: 'On Sale', sortOrder: 2 },
    ],
  },
};
