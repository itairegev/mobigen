'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

// Professional color palettes from top apps
const COLOR_PALETTES = [
  { name: 'Ocean', primary: '#0066FF', secondary: '#00D4AA', accent: '#6366F1' }, // Stripe-inspired
  { name: 'Sunset', primary: '#FF6B35', secondary: '#F7C948', accent: '#E63946' }, // Warm & energetic
  { name: 'Forest', primary: '#059669', secondary: '#34D399', accent: '#065F46' }, // Spotify-inspired
  { name: 'Midnight', primary: '#6366F1', secondary: '#8B5CF6', accent: '#4F46E5' }, // Discord-inspired
  { name: 'Rose', primary: '#EC4899', secondary: '#F472B6', accent: '#DB2777' }, // Modern pink
];

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  popular?: boolean;
}

const templates: Template[] = [
  // Popular templates first
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Full-featured online store with cart & checkout',
    icon: '🛍️',
    category: 'Business',
    features: ['Product catalog', 'Shopping cart', 'Payments', 'Orders'],
    popular: true,
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'ChatGPT-style AI chat interface',
    icon: '🤖',
    category: 'AI & Tech',
    features: ['Chat UI', 'History', 'Context memory', 'Settings'],
    popular: true,
  },
  {
    id: 'loyalty',
    name: 'Loyalty Program',
    description: 'Points, rewards & membership tiers',
    icon: '🎁',
    category: 'Engagement',
    features: ['Points', 'Rewards', 'Tiers', 'QR scan'],
    popular: true,
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Multi-vendor marketplace platform',
    icon: '🏪',
    category: 'Business',
    features: ['Multi-vendor', 'Profiles', 'Reviews', 'Search'],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Property listings with maps',
    icon: '🏠',
    category: 'Business',
    features: ['Listings', 'Maps', 'Favorites', 'Contact'],
  },
  {
    id: 'service-booking',
    name: 'Service Booking',
    description: 'Appointment scheduling system',
    icon: '📅',
    category: 'Services',
    features: ['Calendar', 'Services', 'Notifications', 'Payment'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Menu, ordering & reservations',
    icon: '🍽️',
    category: 'Services',
    features: ['Menu', 'Orders', 'Reservations', 'Rewards'],
  },
  {
    id: 'field-service',
    name: 'Field Service',
    description: 'Mobile technician management',
    icon: '🔧',
    category: 'Services',
    features: ['Jobs', 'Routes', 'Time tracking', 'Invoicing'],
  },
  {
    id: 'pet-services',
    name: 'Pet Services',
    description: 'Pet care booking & profiles',
    icon: '🐾',
    category: 'Services',
    features: ['Pet profiles', 'Grooming', 'Vet', 'Store'],
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Social network with posts & groups',
    icon: '👥',
    category: 'Engagement',
    features: ['Profiles', 'Posts', 'Groups', 'DMs'],
  },
  {
    id: 'event',
    name: 'Events',
    description: 'Event discovery & ticketing',
    icon: '🎫',
    category: 'Engagement',
    features: ['Events', 'Tickets', 'Calendar', 'Check-in'],
  },
  {
    id: 'news',
    name: 'News Reader',
    description: 'Article feeds & bookmarks',
    icon: '📰',
    category: 'Content',
    features: ['Feed', 'Categories', 'Bookmarks', 'Share'],
  },
  {
    id: 'podcast',
    name: 'Podcast',
    description: 'Podcast player & playlists',
    icon: '🎙️',
    category: 'Content',
    features: ['Player', 'Playlists', 'Downloads', 'Subs'],
  },
  {
    id: 'recipe',
    name: 'Recipe',
    description: 'Recipe collection & meal planning',
    icon: '🍳',
    category: 'Content',
    features: ['Recipes', 'Meal plan', 'Shopping', 'Nutrition'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase work & projects',
    icon: '💼',
    category: 'Content',
    features: ['Gallery', 'About', 'Contact', 'Social'],
  },
  {
    id: 'course',
    name: 'Online Course',
    description: 'Learning platform with videos',
    icon: '📚',
    category: 'Education',
    features: ['Lessons', 'Progress', 'Quizzes', 'Certs'],
  },
  {
    id: 'school',
    name: 'School',
    description: 'School management system',
    icon: '🎓',
    category: 'Education',
    features: ['Schedule', 'Grades', 'Assignments', 'News'],
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Workout tracking & plans',
    icon: '💪',
    category: 'Health',
    features: ['Workouts', 'Progress', 'Plans', 'Goals'],
  },
  {
    id: 'church',
    name: 'Church',
    description: 'Church community app',
    icon: '⛪',
    category: 'Organizations',
    features: ['Sermons', 'Events', 'Giving', 'Prayer'],
  },
  {
    id: 'sports-team',
    name: 'Sports Team',
    description: 'Team management & stats',
    icon: '⚽',
    category: 'Organizations',
    features: ['Roster', 'Schedule', 'Stats', 'Chat'],
  },
  {
    id: 'base',
    name: 'Custom App',
    description: 'Start from minimal template',
    icon: '📱',
    category: 'Custom',
    features: ['Tabs', 'Components', 'Theme', 'Storage'],
  },
];

const categories = ['All', 'Business', 'Services', 'Engagement', 'Content', 'Education', 'Health', 'Organizations', 'AI & Tech', 'Custom'];

// Generate bundle ID from project name
function generateBundleId(name: string, fallbackSuffix?: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 30);

  if (!sanitized) {
    return `com.mobigen.app${Date.now().toString(36)}`;
  }

  const suffix = fallbackSuffix ? `.${fallbackSuffix}` : '';
  return `com.mobigen.${sanitized}${suffix}`;
}

// Get random color palette
function getRandomPalette() {
  return COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
}

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectName, setProjectName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Get random palette once on mount
  const [colorPalette] = useState(() => getRandomPalette());

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const popularTemplates = useMemo(() => templates.filter(t => t.popular), []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/projects/new');
    }
  }, [status, router]);

  // Get placeholder text based on selected template
  const getPlaceholderText = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return 'Describe the app you want to build...';

    const examples: Record<string, string> = {
      'ecommerce': 'I want a fashion store with product categories, wishlist, Apple Pay checkout, and order tracking. The store should have a modern minimalist design.',
      'ai-assistant': 'Create a personal AI tutor that helps students learn math. It should explain concepts step by step and provide practice problems.',
      'loyalty': 'Build a coffee shop rewards app where customers earn 1 point per dollar spent. 100 points = free drink. Show nearby store locations.',
      'marketplace': 'Create a local artisan marketplace where crafters can sell handmade goods. Include seller ratings and in-app messaging.',
      'restaurant': 'Build a pizza delivery app with menu customization, real-time order tracking, and a loyalty program.',
      'fitness': 'Create a home workout app with video tutorials, custom workout plans, and progress photos.',
      'community': 'Build a neighborhood community app for sharing local events, recommendations, and lost & found posts.',
    };

    return (selectedTemplate && examples[selectedTemplate]) || `Describe what you want your ${template.name.toLowerCase()} app to do...`;
  };

  // tRPC mutation for creating projects
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      const bundleId = generateBundleId(
        projectName,
        session?.user?.name?.split(' ').map(n => n[0]).join('').toLowerCase()
      );

      const params = new URLSearchParams({
        template: selectedTemplate || 'base',
        name: projectName,
        bundleId,
        primaryColor: colorPalette.primary,
        secondaryColor: colorPalette.secondary,
        prompt: encodeURIComponent(prompt),
      });
      router.push(`/projects/${project.id}?${params.toString()}`);
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      setIsCreating(false);
    },
  });

  const handleCreate = async () => {
    if (!projectName.trim() || !prompt.trim() || !selectedTemplate) return;

    setIsCreating(true);
    const bundleId = generateBundleId(
      projectName,
      session?.user?.name?.split(' ').map(n => n[0]).join('').toLowerCase()
    );

    createProject.mutate({
      name: projectName,
      templateId: selectedTemplate,
      bundleIdIos: bundleId,
      bundleIdAndroid: bundleId.replace(/\./g, '_'),
      branding: {
        primaryColor: colorPalette.primary,
        secondaryColor: colorPalette.secondary,
      },
    });
  };

  const canCreate = selectedTemplate && projectName.trim().length > 0 && prompt.trim().length > 0;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${colorPalette.primary}40 0%, transparent 50%)` }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${colorPalette.secondary}40 0%, transparent 50%)` }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <h1 className="text-xl font-semibold text-white">Create New App</h1>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${colorPalette.primary}20`, color: colorPalette.primary }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorPalette.primary }} />
                {colorPalette.name} Theme
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Template Selection */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Choose a Template</h2>
              <p className="text-white/50 text-sm">Start with a proven foundation</p>
            </div>

            {/* Popular Templates */}
            {selectedCategory === 'All' && !searchQuery && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Popular</p>
                <div className="grid grid-cols-3 gap-3">
                  {popularTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                        selectedTemplate === template.id
                          ? 'bg-white/10'
                          : 'bg-white/5 hover:bg-white/8 border border-white/10'
                      }`}
                      style={{
                        boxShadow: selectedTemplate === template.id ? `0 0 0 2px ${colorPalette.primary}` : undefined
                      }}
                    >
                      {selectedTemplate === template.id && (
                        <div
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: colorPalette.primary }}
                        >
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="text-2xl">{template.icon}</span>
                      <p className="text-white font-medium text-sm mt-2">{template.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': colorPalette.primary } as React.CSSProperties}
              />
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category ? colorPalette.primary : undefined
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`relative p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedTemplate === template.id
                      ? 'bg-white/10'
                      : 'bg-white/5 hover:bg-white/8 border border-white/10'
                  }`}
                  style={{
                    boxShadow: selectedTemplate === template.id ? `0 0 0 2px ${colorPalette.primary}` : undefined
                  }}
                >
                  {selectedTemplate === template.id && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colorPalette.primary }}
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-white/50 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm mt-2">{template.name}</p>
                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - App Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Describe Your App</h2>
              <p className="text-white/50 text-sm">Tell us what you want to build</p>
            </div>

            {/* App Name Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">App Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome App"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': colorPalette.primary } as React.CSSProperties}
              />
              {projectName && (
                <p className="text-xs text-white/40 mt-2">
                  Bundle ID: <span className="text-white/60 font-mono">{generateBundleId(projectName)}</span>
                </p>
              )}
            </div>

            {/* Prompt Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-white/70 mb-2">What should your app do?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={getPlaceholderText()}
                rows={8}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                style={{ '--tw-ring-color': colorPalette.primary } as React.CSSProperties}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-white/40">
                  Be specific about features, design preferences, and user flows
                </p>
                <span className="text-xs text-white/40">{prompt.length} chars</span>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={!canCreate || isCreating}
              className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              style={{
                background: canCreate && !isCreating
                  ? `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.secondary})`
                  : 'rgba(255,255,255,0.1)'
              }}
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating your app...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate App
                </>
              )}
            </button>

            {/* Features Preview */}
            {selectedTemplate && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Included Features</p>
                <div className="flex flex-wrap gap-2">
                  {templates.find(t => t.id === selectedTemplate)?.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-white/70"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span>Powered by AI</span>
              <span>•</span>
              <span>React Native + Expo</span>
              <span>•</span>
              <span>iOS & Android</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Theme:</span>
              <div className="flex gap-1">
                {COLOR_PALETTES.map((p, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: p.primary }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
