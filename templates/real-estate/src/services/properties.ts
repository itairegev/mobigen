import type { Property, Agent, PropertyType, PropertyStatus } from '@/types';

export const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    title: 'Senior Real Estate Agent',
    email: 'sarah.johnson@realestate.com',
    phone: '(555) 123-4567',
    avatar: 'https://i.pravatar.cc/150?img=1',
    bio: 'With over 15 years of experience, I specialize in residential properties and have helped hundreds of families find their dream homes.',
    rating: 4.9,
    reviewCount: 127,
    listingsCount: 45,
    yearsExperience: 15,
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Luxury Property Specialist',
    email: 'michael.chen@realestate.com',
    phone: '(555) 234-5678',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Luxury property expert with a passion for matching discerning clients with exceptional homes.',
    rating: 4.8,
    reviewCount: 89,
    listingsCount: 32,
    yearsExperience: 12,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Commercial Real Estate Advisor',
    email: 'emily.rodriguez@realestate.com',
    phone: '(555) 345-6789',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Specializing in commercial properties and investment opportunities for over 10 years.',
    rating: 4.7,
    reviewCount: 64,
    listingsCount: 28,
    yearsExperience: 10,
  },
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Loft',
    description: 'Stunning modern loft in the heart of downtown with floor-to-ceiling windows, open concept living, and premium finishes throughout. Walking distance to restaurants, shops, and entertainment.',
    type: 'apartment',
    status: 'for-sale',
    price: 825000,
    pricePerSqft: 550,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1500,
    yearBuilt: 2020,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    address: {
      street: '123 Main Street, Unit 501',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      lat: 47.6062,
      lng: -122.3321,
    },
    features: [
      'Hardwood Floors',
      'Stainless Steel Appliances',
      'In-Unit Washer/Dryer',
      'Balcony',
      'Gym Access',
      'Concierge',
      'Pet Friendly',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Charming Victorian Home',
    description: 'Beautiful Victorian home with original details, updated kitchen and baths. Large backyard perfect for entertaining. Located in a quiet, tree-lined neighborhood.',
    type: 'house',
    status: 'for-sale',
    price: 1250000,
    pricePerSqft: 385,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3250,
    lotSize: 7500,
    yearBuilt: 1920,
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    ],
    address: {
      street: '456 Oak Avenue',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      lat: 45.5152,
      lng: -122.6784,
    },
    features: [
      'Original Hardwood',
      'Updated Kitchen',
      'Granite Countertops',
      'Fireplace',
      'Large Backyard',
      'Garage',
      'Covered Porch',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    title: 'Luxury Waterfront Estate',
    description: 'Magnificent waterfront estate with panoramic views, private dock, and infinity pool. Custom-built with the finest materials and attention to detail throughout.',
    type: 'house',
    status: 'for-sale',
    price: 4500000,
    pricePerSqft: 750,
    bedrooms: 6,
    bathrooms: 5.5,
    sqft: 6000,
    lotSize: 25000,
    yearBuilt: 2018,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    ],
    address: {
      street: '789 Lakeshore Drive',
      city: 'Bellevue',
      state: 'WA',
      zipCode: '98004',
      lat: 47.6101,
      lng: -122.2015,
    },
    features: [
      'Waterfront',
      'Private Dock',
      'Infinity Pool',
      'Home Theater',
      'Wine Cellar',
      'Smart Home',
      'Gourmet Kitchen',
      'Guest House',
    ],
    agentId: '2',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '4',
    title: 'Cozy Suburban Townhouse',
    description: 'Perfect starter home in family-friendly neighborhood. Recently renovated with modern amenities. Close to schools, parks, and shopping.',
    type: 'townhouse',
    status: 'for-sale',
    price: 485000,
    pricePerSqft: 323,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1500,
    lotSize: 2000,
    yearBuilt: 2015,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800',
    ],
    address: {
      street: '321 Maple Court',
      city: 'Redmond',
      state: 'WA',
      zipCode: '98052',
      lat: 47.6740,
      lng: -122.1215,
    },
    features: [
      'Open Floor Plan',
      'Updated Appliances',
      'Patio',
      'Two-Car Garage',
      'Community Pool',
      'Playground Access',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '5',
    title: 'Downtown High-Rise Condo',
    description: 'Luxury condo with breathtaking city views. Premium building amenities including rooftop deck, fitness center, and 24/7 concierge.',
    type: 'condo',
    status: 'for-sale',
    price: 675000,
    pricePerSqft: 562,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    yearBuilt: 2019,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    address: {
      street: '555 City Tower, Floor 25',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      lat: 47.6062,
      lng: -122.3321,
    },
    features: [
      'City Views',
      'Rooftop Deck',
      'Fitness Center',
      'Concierge',
      'Secure Parking',
      'Storage Unit',
      'Pet Friendly',
    ],
    agentId: '2',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '6',
    title: 'Spacious Ranch Home',
    description: 'Well-maintained ranch home on large lot with mature landscaping. Great for families with room to grow. Updated throughout.',
    type: 'house',
    status: 'for-sale',
    price: 795000,
    pricePerSqft: 295,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2700,
    lotSize: 12000,
    yearBuilt: 1985,
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800',
      'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800',
    ],
    address: {
      street: '888 Elm Street',
      city: 'Kirkland',
      state: 'WA',
      zipCode: '98033',
      lat: 47.6815,
      lng: -122.2087,
    },
    features: [
      'Large Lot',
      'Updated Kitchen',
      'Master Suite',
      'Finished Basement',
      'Two-Car Garage',
      'Sprinkler System',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '7',
    title: 'Modern Minimalist Apartment',
    description: 'Sleek, modern apartment with designer finishes and smart home features. Perfect for professionals seeking luxury and convenience.',
    type: 'apartment',
    status: 'for-rent',
    price: 3200,
    pricePerSqft: 3.2,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 1000,
    yearBuilt: 2021,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
    ],
    address: {
      street: '999 Tech Avenue, Apt 302',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98109',
      lat: 47.6205,
      lng: -122.3493,
    },
    features: [
      'Smart Home',
      'Floor-to-Ceiling Windows',
      'Washer/Dryer',
      'Fitness Center',
      'Bike Storage',
      'Rooftop Terrace',
    ],
    agentId: '2',
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '8',
    title: 'Historic Craftsman Bungalow',
    description: 'Lovingly restored craftsman with original details. Featuring built-ins, wood trim, and period fixtures. Walking distance to cafes and shops.',
    type: 'house',
    status: 'for-sale',
    price: 925000,
    pricePerSqft: 463,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2000,
    lotSize: 5000,
    yearBuilt: 1925,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ],
    address: {
      street: '234 Heritage Lane',
      city: 'Tacoma',
      state: 'WA',
      zipCode: '98402',
      lat: 47.2529,
      lng: -122.4443,
    },
    features: [
      'Original Woodwork',
      'Built-in Cabinets',
      'Period Fixtures',
      'Updated Systems',
      'Front Porch',
      'Detached Garage',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '9',
    title: 'Contemporary Hillside Home',
    description: 'Stunning contemporary design with sweeping views and natural light. Open floor plan perfect for entertaining. Sustainable features throughout.',
    type: 'house',
    status: 'for-sale',
    price: 2100000,
    pricePerSqft: 600,
    bedrooms: 4,
    bathrooms: 3.5,
    sqft: 3500,
    lotSize: 8000,
    yearBuilt: 2022,
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
    ],
    address: {
      street: '567 Vista Drive',
      city: 'Issaquah',
      state: 'WA',
      zipCode: '98027',
      lat: 47.5301,
      lng: -122.0326,
    },
    features: [
      'Mountain Views',
      'Solar Panels',
      'Radiant Heating',
      'Triple Pane Windows',
      'Chef\'s Kitchen',
      'Home Office',
      'Three-Car Garage',
    ],
    agentId: '2',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '10',
    title: 'Family-Friendly Suburban Home',
    description: 'Perfect family home in top-rated school district. Large yard, updated kitchen, and plenty of space for everyone.',
    type: 'house',
    status: 'for-sale',
    price: 625000,
    pricePerSqft: 260,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2400,
    lotSize: 9000,
    yearBuilt: 2005,
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800',
    ],
    address: {
      street: '890 School Street',
      city: 'Bothell',
      state: 'WA',
      zipCode: '98011',
      lat: 47.7623,
      lng: -122.2054,
    },
    features: [
      'Cul-de-sac Location',
      'Updated Kitchen',
      'Large Yard',
      'Covered Patio',
      'Two-Car Garage',
      'Storage Shed',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '11',
    title: 'Urban Live/Work Loft',
    description: 'Versatile loft space perfect for artists, entrepreneurs, or remote workers. High ceilings, abundant natural light, and flexible layout.',
    type: 'apartment',
    status: 'for-rent',
    price: 2800,
    pricePerSqft: 2.33,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 1200,
    yearBuilt: 2017,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    address: {
      street: '345 Industrial Way, Unit 205',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98108',
      lat: 47.5480,
      lng: -122.3238,
    },
    features: [
      'High Ceilings',
      'Polished Concrete',
      'Exposed Brick',
      'Flexible Space',
      'Abundant Windows',
      'Bike Storage',
    ],
    agentId: '3',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '12',
    title: 'Beachfront Vacation Home',
    description: 'Rare beachfront property with private beach access. Perfect vacation home or rental investment. Stunning ocean views from every room.',
    type: 'house',
    status: 'for-sale',
    price: 1850000,
    pricePerSqft: 617,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 3000,
    lotSize: 15000,
    yearBuilt: 2010,
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800',
    ],
    address: {
      street: '123 Ocean Drive',
      city: 'Cannon Beach',
      state: 'OR',
      zipCode: '97110',
      lat: 45.8918,
      lng: -123.9615,
    },
    features: [
      'Beachfront',
      'Ocean Views',
      'Private Beach Access',
      'Deck',
      'Fireplace',
      'Rental Income',
    ],
    agentId: '2',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  {
    id: '13',
    title: 'Newly Built Townhome',
    description: 'Brand new construction in growing neighborhood. Modern finishes, energy-efficient systems, and low-maintenance living.',
    type: 'townhouse',
    status: 'for-sale',
    price: 565000,
    pricePerSqft: 353,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1600,
    lotSize: 1500,
    yearBuilt: 2024,
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800',
    ],
    address: {
      street: '678 New Development Lane',
      city: 'Renton',
      state: 'WA',
      zipCode: '98057',
      lat: 47.4829,
      lng: -122.2171,
    },
    features: [
      'New Construction',
      'Energy Efficient',
      'Smart Home Ready',
      'Quartz Counters',
      'Stainless Appliances',
      'HOA Amenities',
    ],
    agentId: '1',
    createdAt: new Date('2024-01-23'),
    updatedAt: new Date('2024-01-23'),
  },
  {
    id: '14',
    title: 'Investment Opportunity Duplex',
    description: 'Well-maintained duplex with strong rental history. Both units currently occupied with excellent tenants. Great cash flow.',
    type: 'house',
    status: 'for-sale',
    price: 775000,
    pricePerSqft: 258,
    bedrooms: 6,
    bathrooms: 4,
    sqft: 3000,
    lotSize: 6000,
    yearBuilt: 1995,
    images: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800',
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800',
    ],
    address: {
      street: '901 Investment Avenue',
      city: 'Everett',
      state: 'WA',
      zipCode: '98201',
      lat: 47.9790,
      lng: -122.2021,
    },
    features: [
      'Income Property',
      'Occupied Units',
      'Separate Utilities',
      'Off-Street Parking',
      'Low Maintenance',
      'Good Cash Flow',
    ],
    agentId: '3',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: '15',
    title: 'Prime Commercial Space',
    description: 'Excellent commercial location with high visibility and traffic. Perfect for retail, office, or restaurant. Ample parking.',
    type: 'commercial',
    status: 'for-sale',
    price: 1500000,
    pricePerSqft: 375,
    bedrooms: 0,
    bathrooms: 2,
    sqft: 4000,
    lotSize: 20000,
    yearBuilt: 2000,
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800',
    ],
    address: {
      street: '1234 Commerce Boulevard',
      city: 'Bellevue',
      state: 'WA',
      zipCode: '98004',
      lat: 47.6101,
      lng: -122.2015,
    },
    features: [
      'High Visibility',
      'Corner Lot',
      'Ample Parking',
      'Updated Systems',
      'Flexible Layout',
      'Zoning Flexibility',
    ],
    agentId: '3',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
];

// Simulated API calls with delays
export async function getProperties(): Promise<Property[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...MOCK_PROPERTIES];
}

export async function getPropertyById(id: string): Promise<Property | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_PROPERTIES.find((p) => p.id === id) || null;
}

export async function getAgentById(id: string): Promise<Agent | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_AGENTS.find((a) => a.id === id) || null;
}

export async function searchProperties(
  query?: string,
  filters?: {
    type?: PropertyType[];
    status?: PropertyStatus;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
  }
): Promise<Property[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  let results = [...MOCK_PROPERTIES];

  // Filter by query
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.city.toLowerCase().includes(q) ||
        p.address.state.toLowerCase().includes(q)
    );
  }

  // Filter by type
  if (filters?.type && filters.type.length > 0) {
    results = results.filter((p) => filters.type!.includes(p.type));
  }

  // Filter by status
  if (filters?.status) {
    results = results.filter((p) => p.status === filters.status);
  }

  // Filter by price
  if (filters?.priceMin !== undefined) {
    results = results.filter((p) => p.price >= filters.priceMin!);
  }
  if (filters?.priceMax !== undefined) {
    results = results.filter((p) => p.price <= filters.priceMax!);
  }

  // Filter by bedrooms
  if (filters?.bedrooms !== undefined) {
    results = results.filter((p) => p.bedrooms >= filters.bedrooms!);
  }

  // Filter by bathrooms
  if (filters?.bathrooms !== undefined) {
    results = results.filter((p) => p.bathrooms >= filters.bathrooms!);
  }

  // Filter by city
  if (filters?.city) {
    results = results.filter((p) =>
      p.address.city.toLowerCase().includes(filters.city!.toLowerCase())
    );
  }

  return results;
}

export async function getFeaturedProperties(): Promise<Property[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_PROPERTIES.filter((p) => p.status === 'for-sale').slice(0, 5);
}
