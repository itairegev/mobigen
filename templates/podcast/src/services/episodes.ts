import { Episode, Series } from '../types';

export const MOCK_SERIES: Series[] = [
  {
    id: 'series-1',
    name: 'Tech Talks Daily',
    description: 'Deep dives into technology, innovation, and the future of computing',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400',
    category: 'Technology',
    episodeCount: 12,
  },
  {
    id: 'series-2',
    name: 'Creative Minds',
    description: 'Conversations with artists, designers, and creative professionals',
    imageUrl: 'https://images.unsplash.com/photo-1�513364776144-60967b0f800f?w=400',
    category: 'Arts & Culture',
    episodeCount: 5,
  },
  {
    id: 'series-3',
    name: 'Business Insights',
    description: 'Stories and strategies from successful entrepreneurs',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400',
    category: 'Business',
    episodeCount: 3,
  },
];

export const MOCK_EPISODES: Episode[] = [
  // Tech Talks Daily
  {
    id: 'ep-1',
    seriesId: 'series-1',
    title: 'The Future of AI: Beyond ChatGPT',
    description: 'Exploring the next generation of artificial intelligence and its impact on society, work, and creativity.',
    duration: 2847, // 47:27
    publishedAt: new Date('2024-01-15'),
    audioUrl: 'https://example.com/audio/ep-1.mp3',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    showNotes: `In this episode, we explore:

- The evolution from GPT-3 to GPT-4 and beyond
- Multi-modal AI systems combining text, image, and audio
- The ethical implications of increasingly powerful AI
- How AI assistants will integrate into our daily lives
- The future of human-AI collaboration

Guest: Dr. Sarah Chen, AI Research Scientist at Stanford

Resources:
- Research paper: "Scaling Laws for Neural Language Models"
- Book: "The Alignment Problem" by Brian Christian
- Tool: OpenAI Playground

Timestamps:
0:00 - Introduction
3:45 - Current state of AI
12:30 - Multi-modal systems
24:15 - Ethical considerations
35:00 - Future predictions
42:00 - Q&A`,
    exclusive: false,
    downloadable: true,
    playCount: 15432,
    season: 1,
    episodeNumber: 1,
  },
  {
    id: 'ep-2',
    seriesId: 'series-1',
    title: 'Quantum Computing Explained',
    description: 'Making sense of quantum computers and their potential to revolutionize computing as we know it.',
    duration: 3120, // 52:00
    publishedAt: new Date('2024-01-08'),
    audioUrl: 'https://example.com/audio/ep-2.mp3',
    showNotes: `Deep dive into quantum computing:

- What makes quantum computers different
- Qubits, superposition, and entanglement explained
- Real-world applications in cryptography and drug discovery
- Current limitations and challenges
- Timeline for practical quantum computers

Guest: Prof. Michael Zhang, Quantum Physics, MIT

Resources:
- IBM Quantum Experience (free online quantum computer)
- Book: "Quantum Computing for Everyone" by Chris Bernhardt
- Course: Introduction to Quantum Computing (edX)

Timestamps:
0:00 - What is quantum computing?
8:20 - Key concepts explained
18:45 - Current state of technology
32:00 - Applications
44:15 - The future`,
    exclusive: false,
    downloadable: true,
    playCount: 12890,
    season: 1,
    episodeNumber: 2,
  },
  {
    id: 'ep-3',
    seriesId: 'series-1',
    title: 'Building Scalable Systems',
    description: 'Lessons learned from architecting systems that handle millions of users.',
    duration: 2640, // 44:00
    publishedAt: new Date('2024-01-01'),
    audioUrl: 'https://example.com/audio/ep-3.mp3',
    showNotes: `System architecture at scale:

- Microservices vs monoliths
- Database sharding strategies
- Caching layers and CDNs
- Load balancing techniques
- Monitoring and observability

Guest: Alex Rivera, Principal Engineer at Stripe

Key Takeaways:
- Start simple, scale incrementally
- Measure everything
- Design for failure
- Automate operations

Tools Mentioned:
- Kubernetes for orchestration
- Redis for caching
- Prometheus for monitoring
- Terraform for infrastructure

Timestamps:
0:00 - Introduction to scalability
5:30 - Microservices architecture
15:00 - Database strategies
25:30 - Caching and CDNs
35:00 - War stories and lessons learned`,
    exclusive: true,
    downloadable: true,
    playCount: 8765,
    season: 1,
    episodeNumber: 3,
  },
  {
    id: 'ep-4',
    seriesId: 'series-1',
    title: 'Cybersecurity in 2024',
    description: 'Understanding modern security threats and how to protect yourself and your organization.',
    duration: 2580, // 43:00
    publishedAt: new Date('2023-12-25'),
    audioUrl: 'https://example.com/audio/ep-4.mp3',
    showNotes: `Security landscape overview:

- Most common attack vectors in 2024
- Zero-trust architecture
- Password managers and MFA
- Cloud security best practices
- Supply chain attacks

Guest: Jessica Park, CISO at Cloudflare

Security Checklist:
□ Enable MFA everywhere
□ Use a password manager
□ Keep software updated
□ Regular security audits
□ Employee training

Resources:
- NIST Cybersecurity Framework
- OWASP Top 10
- Troy Hunt's "Have I Been Pwned"

Timestamps:
0:00 - Current threat landscape
10:00 - Zero-trust explained
20:15 - Practical security tips
30:00 - Enterprise security
38:45 - Future of cybersecurity`,
    exclusive: false,
    downloadable: true,
    playCount: 11234,
    season: 1,
    episodeNumber: 4,
  },
  {
    id: 'ep-5',
    seriesId: 'series-1',
    title: 'The Rise of WebAssembly',
    description: 'How WebAssembly is changing web development and enabling new possibilities.',
    duration: 2460, // 41:00
    publishedAt: new Date('2023-12-18'),
    audioUrl: 'https://example.com/audio/ep-5.mp3',
    showNotes: `WebAssembly deep dive:

- What is WebAssembly (Wasm)?
- Performance benefits over JavaScript
- Running native code in the browser
- Use cases: Gaming, video editing, CAD
- The future of web applications

Guest: Lin Chen, WebAssembly Core Team

Demo Applications:
- Figma (runs C++ in the browser)
- Google Earth (3D rendering)
- Autodesk AutoCAD (full CAD in browser)

Getting Started:
- Rust + wasm-pack
- AssemblyScript
- C/C++ with Emscripten

Timestamps:
0:00 - Introduction to Wasm
7:00 - How it works
15:30 - Real-world examples
26:00 - Developer experience
35:15 - Future roadmap`,
    exclusive: true,
    downloadable: false,
    playCount: 7890,
    season: 1,
    episodeNumber: 5,
  },
  {
    id: 'ep-6',
    seriesId: 'series-1',
    title: 'Mobile Development Trends',
    description: 'React Native, Flutter, and the future of cross-platform mobile development.',
    duration: 2880, // 48:00
    publishedAt: new Date('2023-12-11'),
    audioUrl: 'https://example.com/audio/ep-6.mp3',
    showNotes: `Mobile development landscape:

- React Native vs Flutter comparison
- Native vs cross-platform decision
- State management patterns
- Performance optimization
- App distribution challenges

Guests:
- Maria Garcia, React Native Core Team
- Tom Wilson, Flutter Developer Advocate

Framework Comparison:
React Native:
✓ JavaScript/TypeScript
✓ Huge ecosystem
✓ Hot reload
✗ Requires native bridges

Flutter:
✓ Single codebase
✓ Beautiful UI
✓ Fast performance
✗ Larger app size

Resources:
- React Native docs
- Flutter.dev
- Expo platform

Timestamps:
0:00 - State of mobile dev
9:00 - React Native deep dive
24:00 - Flutter overview
35:00 - Making the choice
42:00 - Tips and best practices`,
    exclusive: false,
    downloadable: true,
    playCount: 9543,
    season: 1,
    episodeNumber: 6,
  },

  // Creative Minds
  {
    id: 'ep-7',
    seriesId: 'series-2',
    title: 'Designing for Accessibility',
    description: 'Creating inclusive digital experiences that work for everyone.',
    duration: 2220, // 37:00
    publishedAt: new Date('2024-01-12'),
    audioUrl: 'https://example.com/audio/ep-7.mp3',
    showNotes: `Accessibility in design:

- Understanding diverse user needs
- WCAG guidelines explained
- Color contrast and typography
- Screen reader compatibility
- Keyboard navigation

Guest: Maya Patel, Accessibility Consultant

Key Principles:
1. Perceivable
2. Operable
3. Understandable
4. Robust

Tools:
- WAVE browser extension
- axe DevTools
- Color contrast checker
- Screen reader testing

Timestamps:
0:00 - Why accessibility matters
6:00 - Common barriers
14:00 - Design principles
22:00 - Testing strategies
30:00 - Real-world examples`,
    exclusive: false,
    downloadable: true,
    playCount: 6789,
    season: 1,
    episodeNumber: 7,
  },
  {
    id: 'ep-8',
    seriesId: 'series-2',
    title: 'The Art of Typography',
    description: 'Exploring how fonts shape our reading experience and brand identity.',
    duration: 2340, // 39:00
    publishedAt: new Date('2024-01-05'),
    audioUrl: 'https://example.com/audio/ep-8.mp3',
    showNotes: `Typography fundamentals:

- History of typefaces
- Serif vs sans-serif
- Font pairing principles
- Hierarchy and readability
- Variable fonts

Guest: James Cooper, Type Designer

Font Recommendations:
Serif: Georgia, Merriweather, Lora
Sans: Inter, Roboto, Open Sans
Display: Playfair, Bebas Neue
Mono: Fira Code, JetBrains Mono

Resources:
- Google Fonts
- Adobe Fonts
- FontPair.co
- Practical Typography by Butterick

Timestamps:
0:00 - Introduction to typography
8:00 - Typeface anatomy
16:00 - Choosing fonts
24:00 - Font pairing
32:00 - Web typography tips`,
    exclusive: true,
    downloadable: true,
    playCount: 5432,
    season: 1,
    episodeNumber: 8,
  },
  {
    id: 'ep-9',
    seriesId: 'series-2',
    title: 'Color Theory in Practice',
    description: 'Understanding color psychology and creating harmonious color palettes.',
    duration: 2160, // 36:00
    publishedAt: new Date('2023-12-29'),
    audioUrl: 'https://example.com/audio/ep-9.mp3',
    showNotes: `Color in design:

- Color wheel basics
- Complementary vs analogous
- Color psychology
- Creating brand palettes
- Accessibility considerations

Guest: Sofia Martinez, Brand Designer

Color Schemes:
- Monochromatic
- Analogous
- Complementary
- Triadic
- Split-complementary

Tools:
- Adobe Color
- Coolors.co
- Paletton
- Color Hunt

Case Studies:
- Spotify (green energy)
- Mailchimp (yellow friendliness)
- Stripe (purple trust)

Timestamps:
0:00 - Color theory basics
9:00 - Psychology of colors
18:00 - Building palettes
27:00 - Brand examples
33:00 - Practical tips`,
    exclusive: false,
    downloadable: true,
    playCount: 4987,
    season: 1,
    episodeNumber: 9,
  },
  {
    id: 'ep-10',
    seriesId: 'series-2',
    title: 'Motion Design Fundamentals',
    description: 'Adding life to interfaces with thoughtful animation and transitions.',
    duration: 2520, // 42:00
    publishedAt: new Date('2023-12-22'),
    audioUrl: 'https://example.com/audio/ep-10.mp3',
    showNotes: `Animation in UX:

- Principles of animation
- Easing functions
- Duration and timing
- Micro-interactions
- Performance considerations

Guest: David Kim, Motion Designer at Apple

Animation Principles:
1. Squash and stretch
2. Anticipation
3. Staging
4. Follow through
5. Timing

Tools:
- After Effects
- Principle
- Framer Motion
- GSAP

Examples:
- Pull-to-refresh animations
- Loading states
- Page transitions
- Button feedback

Timestamps:
0:00 - Why motion matters
7:30 - Animation principles
17:00 - Easing curves
25:00 - Micro-interactions
34:00 - Best practices`,
    exclusive: true,
    downloadable: false,
    playCount: 6123,
    season: 1,
    episodeNumber: 10,
  },
  {
    id: 'ep-11',
    seriesId: 'series-2',
    title: 'Building Design Systems',
    description: 'Creating scalable design systems for consistent user experiences.',
    duration: 2700, // 45:00
    publishedAt: new Date('2023-12-15'),
    audioUrl: 'https://example.com/audio/ep-11.mp3',
    showNotes: `Design systems explained:

- What is a design system?
- Components vs patterns
- Documentation strategies
- Governance and maintenance
- Adoption challenges

Guest: Rachel Adams, Design Systems Lead at Airbnb

Famous Design Systems:
- Material Design (Google)
- Human Interface Guidelines (Apple)
- Carbon (IBM)
- Polaris (Shopify)

Building Blocks:
- Color palette
- Typography scale
- Spacing system
- Component library
- Documentation

Tools:
- Figma
- Storybook
- Zeroheight
- Supernova

Timestamps:
0:00 - Introduction
6:00 - Core principles
15:00 - Component libraries
26:00 - Documentation
35:00 - Implementation
40:00 - Lessons learned`,
    exclusive: false,
    downloadable: true,
    playCount: 7654,
    season: 1,
    episodeNumber: 11,
  },

  // Business Insights
  {
    id: 'ep-12',
    seriesId: 'series-3',
    title: 'From Idea to IPO',
    description: 'The journey of building a billion-dollar company from scratch.',
    duration: 3300, // 55:00
    publishedAt: new Date('2024-01-10'),
    audioUrl: 'https://example.com/audio/ep-12.mp3',
    showNotes: `Startup journey:

- Finding product-market fit
- Fundraising strategies
- Building the right team
- Scaling challenges
- Going public

Guest: Jennifer Liu, CEO & Founder of TechCorp

Key Milestones:
Year 1: Idea validation
Year 2: Product launch
Year 3: Series A ($10M)
Year 4: Series B ($50M)
Year 5: Series C ($200M)
Year 7: IPO ($5B valuation)

Lessons Learned:
- Hire slowly, fire quickly
- Customer feedback is gold
- Cash is king
- Culture matters
- Patience and persistence

Resources:
- "The Lean Startup" by Eric Ries
- Y Combinator Startup School
- "Zero to One" by Peter Thiel

Timestamps:
0:00 - The beginning
10:00 - Product-market fit
22:00 - Fundraising journey
35:00 - Scaling pains
45:00 - IPO preparation
50:00 - Advice for founders`,
    exclusive: false,
    downloadable: true,
    playCount: 13456,
    season: 1,
    episodeNumber: 12,
  },
  {
    id: 'ep-13',
    seriesId: 'series-3',
    title: 'Remote Work Revolution',
    description: 'How companies are adapting to the new era of distributed teams.',
    duration: 2400, // 40:00
    publishedAt: new Date('2024-01-03'),
    audioUrl: 'https://example.com/audio/ep-13.mp3',
    showNotes: `Remote work strategies:

- Async communication
- Building remote culture
- Productivity tools
- Work-life balance
- Hiring globally

Guest: Marcus Johnson, VP of Remote at GitLab

Best Practices:
✓ Documentation-first culture
✓ Regular video standups
✓ Flexible working hours
✓ In-person retreats
✓ Clear communication channels

Tools:
- Slack for messaging
- Notion for docs
- Zoom for meetings
- Loom for async video
- Donut for team bonding

Challenges:
- Timezone coordination
- Maintaining culture
- Onboarding remotely
- Combating isolation

Timestamps:
0:00 - State of remote work
8:00 - Communication strategies
18:00 - Tools and processes
27:00 - Culture building
34:00 - Future predictions`,
    exclusive: true,
    downloadable: true,
    playCount: 9876,
    season: 1,
    episodeNumber: 13,
  },
  {
    id: 'ep-14',
    seriesId: 'series-3',
    title: 'Sustainable Business Models',
    description: 'Building profitable companies that also benefit society and the environment.',
    duration: 2640, // 44:00
    publishedAt: new Date('2023-12-27'),
    audioUrl: 'https://example.com/audio/ep-14.mp3',
    showNotes: `Sustainability in business:

- Triple bottom line: People, Planet, Profit
- B Corp certification
- Carbon neutrality strategies
- Circular economy models
- Impact measurement

Guest: Emma Watson, Sustainability Officer at Patagonia

Sustainable Practices:
- Renewable energy use
- Sustainable supply chains
- Waste reduction programs
- Employee wellbeing initiatives
- Community engagement

Examples:
- Patagonia: 1% for the Planet
- Allbirds: Carbon neutral shoes
- Interface: Mission Zero
- Eileen Fisher: Take-Back program

Frameworks:
- B Impact Assessment
- UN Sustainable Development Goals
- GRI Standards
- Science-Based Targets

Timestamps:
0:00 - Why sustainability matters
9:00 - Business case for sustainability
19:00 - Implementation strategies
30:00 - Measuring impact
38:00 - Future of business`,
    exclusive: false,
    downloadable: true,
    playCount: 6234,
    season: 1,
    episodeNumber: 14,
  },
];

/**
 * Fetch all episodes
 */
export async function getAllEpisodes(): Promise<Episode[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_EPISODES].sort((a, b) =>
    b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

/**
 * Fetch episode by ID
 */
export async function getEpisodeById(id: string): Promise<Episode | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_EPISODES.find(ep => ep.id === id) || null;
}

/**
 * Fetch episodes by series
 */
export async function getEpisodesBySeries(seriesId: string): Promise<Episode[]> {
  await new Promise(resolve => setTimeout(resolve, 250));
  return MOCK_EPISODES.filter(ep => ep.seriesId === seriesId)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/**
 * Fetch all series
 */
export async function getAllSeries(): Promise<Series[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...MOCK_SERIES];
}

/**
 * Search episodes
 */
export async function searchEpisodes(query: string): Promise<Episode[]> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const lowerQuery = query.toLowerCase();
  return MOCK_EPISODES.filter(ep =>
    ep.title.toLowerCase().includes(lowerQuery) ||
    ep.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get featured/latest episodes
 */
export async function getFeaturedEpisodes(limit: number = 5): Promise<Episode[]> {
  await new Promise(resolve => setTimeout(resolve, 250));
  return [...MOCK_EPISODES]
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
}

/**
 * Get exclusive episodes (subscriber-only)
 */
export async function getExclusiveEpisodes(): Promise<Episode[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_EPISODES.filter(ep => ep.exclusive)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
