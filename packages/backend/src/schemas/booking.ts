/**
 * Booking/Appointments Template Schema
 */

import type { TemplateSchema } from './types';

export const bookingSchema: TemplateSchema = {
  templateId: 'booking',
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
        { name: 'role', type: 'string', default: 'customer' },
        { name: 'avatarUrl', type: 'string' },
        { name: 'notificationsEnabled', type: 'boolean', default: true },
        { name: 'createdAt', type: 'string' },
      ],
    },
    {
      name: 'services',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'description', type: 'string' },
        { name: 'duration', type: 'number', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'categoryId', type: 'string' },
        { name: 'imageUrl', type: 'string' },
        { name: 'isActive', type: 'boolean', default: true },
        { name: 'maxCapacity', type: 'number', default: 1 },
        { name: 'bufferTime', type: 'number', default: 0 },
        { name: 'requiresDeposit', type: 'boolean', default: false },
        { name: 'depositAmount', type: 'number' },
      ],
      gsi: [
        {
          name: 'by-category',
          partitionKey: { name: 'categoryId', type: 'S' },
          sortKey: { name: 'name', type: 'S' },
        },
      ],
    },
    {
      name: 'appointments',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'userId', type: 'string', required: true },
        { name: 'serviceId', type: 'string', required: true },
        { name: 'staffId', type: 'string' },
        { name: 'date', type: 'string', required: true },
        { name: 'startTime', type: 'string', required: true },
        { name: 'endTime', type: 'string', required: true },
        { name: 'status', type: 'string', default: 'pending' },
        { name: 'notes', type: 'string' },
        { name: 'totalPrice', type: 'number' },
        { name: 'depositPaid', type: 'boolean', default: false },
        { name: 'reminderSent', type: 'boolean', default: false },
        { name: 'createdAt', type: 'string' },
      ],
      gsi: [
        {
          name: 'by-date',
          partitionKey: { name: 'date', type: 'S' },
          sortKey: { name: 'startTime', type: 'S' },
        },
        {
          name: 'by-status',
          partitionKey: { name: 'status', type: 'S' },
          sortKey: { name: 'date', type: 'S' },
        },
      ],
    },
    {
      name: 'availability',
      partitionKey: { name: 'pk', type: 'S' },
      sortKey: { name: 'sk', type: 'S' },
      attributes: [
        { name: 'id', type: 'string', required: true },
        { name: 'staffId', type: 'string' },
        { name: 'dayOfWeek', type: 'number', required: true },
        { name: 'startTime', type: 'string', required: true },
        { name: 'endTime', type: 'string', required: true },
        { name: 'isActive', type: 'boolean', default: true },
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
        { name: 'sortOrder', type: 'number', default: 0 },
        { name: 'isActive', type: 'boolean', default: true },
      ],
    },
  ],
  seedData: {
    availability: [
      { id: 'avail-mon', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
      { id: 'avail-tue', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      { id: 'avail-wed', dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
      { id: 'avail-thu', dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
      { id: 'avail-fri', dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
    ],
  },
};
