// ============================================================================
// Mock Announcements Service
// ============================================================================

import type { Announcement } from '../types';

const now = new Date();

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'School Picture Day - Tomorrow!',
    content: 'Don\'t forget tomorrow is school picture day! Please wear your best outfit and arrive on time. Retake day will be scheduled for next month.',
    postedBy: 'Principal Thompson',
    postedByRole: 'principal',
    postedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    category: 'event',
    read: false,
  },
  {
    id: 'ann-2',
    title: 'Parent-Teacher Conferences Next Week',
    content: 'Parent-teacher conferences will be held next Tuesday and Wednesday from 3:00 PM to 7:00 PM. Please sign up for your time slot on the school website.',
    postedBy: 'Admin Office',
    postedByRole: 'admin',
    postedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'normal',
    category: 'event',
    read: true,
  },
  {
    id: 'ann-3',
    title: 'Science Fair Registration Open',
    content: 'The annual science fair registration is now open! Submit your project proposal by the end of this month. Prizes will be awarded in multiple categories.',
    postedBy: 'Dr. Martinez',
    postedByRole: 'teacher',
    postedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'normal',
    category: 'academic',
    read: true,
    expiresAt: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ann-4',
    title: 'Updated COVID-19 Guidelines',
    content: 'Please review the updated COVID-19 safety guidelines effective immediately. Masks are now optional but recommended in crowded areas.',
    postedBy: 'Principal Thompson',
    postedByRole: 'principal',
    postedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'urgent',
    category: 'emergency',
    read: false,
    attachments: [
      {
        id: 'att-covid',
        name: 'COVID-Guidelines-2024.pdf',
        type: 'application/pdf',
        url: 'https://example.com/covid-guidelines.pdf',
        size: 156000,
      },
    ],
  },
  {
    id: 'ann-5',
    title: 'Midterm Exam Schedule Released',
    content: 'The midterm exam schedule has been posted. Please check the school calendar for your exam dates and times. Study guides are available from your teachers.',
    postedBy: 'Admin Office',
    postedByRole: 'admin',
    postedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    category: 'deadline',
    read: true,
  },
  {
    id: 'ann-6',
    title: 'Winter Sports Tryouts',
    content: 'Tryouts for winter sports (basketball, wrestling, swim team) begin next Monday. Sign up in the athletic office. All participants must have a current physical on file.',
    postedBy: 'Coach Williams',
    postedByRole: 'teacher',
    postedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'normal',
    category: 'event',
    read: true,
  },
  {
    id: 'ann-7',
    title: 'Library Hours Extended',
    content: 'The library will now be open until 6 PM on weekdays to provide more study time. Weekend hours remain 10 AM - 4 PM.',
    postedBy: 'Ms. Chen, Librarian',
    postedByRole: 'teacher',
    postedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    category: 'general',
    read: true,
  },
  {
    id: 'ann-8',
    title: 'School Fundraiser Kicks Off',
    content: 'Our annual school fundraiser starts this week! All proceeds go towards new sports equipment and library books. Top sellers win prizes!',
    postedBy: 'PTA President',
    postedByRole: 'admin',
    postedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'normal',
    category: 'general',
    read: true,
  },
];

export async function getAnnouncements(category?: string): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (category) {
    return MOCK_ANNOUNCEMENTS.filter((a) => a.category === category);
  }

  return MOCK_ANNOUNCEMENTS.sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_ANNOUNCEMENTS.find((a) => a.id === id) || null;
}

export async function getUnreadAnnouncements(): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return MOCK_ANNOUNCEMENTS.filter((a) => !a.read);
}

export async function markAnnouncementRead(id: string): Promise<Announcement> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const announcement = MOCK_ANNOUNCEMENTS.find((a) => a.id === id);
  if (!announcement) {
    throw new Error('Announcement not found');
  }

  return {
    ...announcement,
    read: true,
  };
}
