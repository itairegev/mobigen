export interface Session {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601 format
  endTime: string;
  trackId: string;
  trackName: string;
  trackColor: string;
  speakerIds: string[];
  room: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  capacity: number;
  enrolled: number;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  avatar: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
  sessionIds: string[];
}

export interface Attendee {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  bio?: string;
  interests: string[];
  linkedin?: string;
  twitter?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  description: string;
  website: string;
  booth?: string;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface Venue {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  amenities: string[];
}

export interface AgendaItem {
  sessionId: string;
  notes?: string;
  reminder: boolean;
  addedAt: Date;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueAddress: string;
  website: string;
  hashtag: string;
}
