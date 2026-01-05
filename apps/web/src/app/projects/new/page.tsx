'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
}

const templates: Template[] = [
  // E-Commerce & Business
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Online store with products, cart, and checkout',
    icon: '🛍️',
    category: 'Business',
    features: ['Product catalog', 'Shopping cart', 'Checkout flow', 'Order history'],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Multi-vendor marketplace with seller profiles',
    icon: '🏪',
    category: 'Business',
    features: ['Multi-vendor', 'Seller profiles', 'Reviews', 'Search & filters'],
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Property listings with maps and virtual tours',
    icon: '🏠',
    category: 'Business',
    features: ['Property listings', 'Map view', 'Favorites', 'Agent contact'],
  },

  // Services & Booking
  {
    id: 'service-booking',
    name: 'Service Booking',
    description: 'Appointment scheduling for service businesses',
    icon: '📅',
    category: 'Services',
    features: ['Calendar booking', 'Service catalog', 'Notifications', 'Payment'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Menu browsing, ordering, and reservations',
    icon: '🍽️',
    category: 'Services',
    features: ['Digital menu', 'Online ordering', 'Table reservations', 'Loyalty rewards'],
  },
  {
    id: 'field-service',
    name: 'Field Service',
    description: 'Job management for mobile technicians',
    icon: '🔧',
    category: 'Services',
    features: ['Job scheduling', 'Route optimization', 'Time tracking', 'Invoicing'],
  },
  {
    id: 'pet-services',
    name: 'Pet Services',
    description: 'Pet care booking and management',
    icon: '🐾',
    category: 'Services',
    features: ['Pet profiles', 'Grooming booking', 'Vet appointments', 'Pet store'],
  },

  // Loyalty & Engagement
  {
    id: 'loyalty',
    name: 'Loyalty Program',
    description: 'Points-based rewards and membership tiers',
    icon: '🎁',
    category: 'Engagement',
    features: ['Points system', 'Rewards catalog', 'Tier progression', 'Transaction history'],
  },
  {
    id: 'community',
    name: 'Community',
    description: 'Social community with posts and groups',
    icon: '👥',
    category: 'Engagement',
    features: ['User profiles', 'Posts & comments', 'Groups', 'Direct messages'],
  },
  {
    id: 'event',
    name: 'Events',
    description: 'Event discovery and ticket management',
    icon: '🎫',
    category: 'Engagement',
    features: ['Event listings', 'Ticketing', 'Calendar sync', 'Check-in'],
  },

  // Content & Media
  {
    id: 'news',
    name: 'News Reader',
    description: 'Article feeds with categories and bookmarks',
    icon: '📰',
    category: 'Content',
    features: ['Article feed', 'Categories', 'Bookmarks', 'Share functionality'],
  },
  {
    id: 'podcast',
    name: 'Podcast',
    description: 'Podcast player with episodes and playlists',
    icon: '🎙️',
    category: 'Content',
    features: ['Episode player', 'Playlists', 'Downloads', 'Subscriptions'],
  },
  {
    id: 'recipe',
    name: 'Recipe',
    description: 'Recipe collection with meal planning',
    icon: '🍳',
    category: 'Content',
    features: ['Recipe browser', 'Meal planner', 'Shopping list', 'Nutrition info'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase work with projects and contact',
    icon: '💼',
    category: 'Content',
    features: ['Project gallery', 'About section', 'Contact form', 'Social links'],
  },

  // Education & Learning
  {
    id: 'course',
    name: 'Online Course',
    description: 'Learning platform with video lessons',
    icon: '📚',
    category: 'Education',
    features: ['Video lessons', 'Progress tracking', 'Quizzes', 'Certificates'],
  },
  {
    id: 'school',
    name: 'School',
    description: 'School management for students and parents',
    icon: '🎓',
    category: 'Education',
    features: ['Class schedule', 'Grades', 'Assignments', 'Announcements'],
  },

  // Health & Fitness
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Workout tracking and fitness plans',
    icon: '💪',
    category: 'Health',
    features: ['Workout library', 'Progress tracking', 'Custom plans', 'Achievements'],
  },

  // Organizations
  {
    id: 'church',
    name: 'Church',
    description: 'Church community with sermons and events',
    icon: '⛪',
    category: 'Organizations',
    features: ['Sermon archive', 'Event calendar', 'Giving', 'Prayer requests'],
  },
  {
    id: 'sports-team',
    name: 'Sports Team',
    description: 'Team management with schedules and stats',
    icon: '⚽',
    category: 'Organizations',
    features: ['Team roster', 'Game schedule', 'Stats tracking', 'Team chat'],
  },

  // AI & Tech
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'Chat interface with AI-powered responses',
    icon: '🤖',
    category: 'AI & Tech',
    features: ['Chat interface', 'Conversation history', 'Suggestions', 'Settings'],
  },

  // Custom
  {
    id: 'base',
    name: 'Custom App',
    description: 'Start from scratch with a minimal template',
    icon: '📱',
    category: 'Custom',
    features: ['Tab navigation', 'Basic components', 'Theme support', 'Storage'],
  },
];

type Step = 'template' | 'details' | 'branding' | 'prompt';

const categories = ['All', 'Business', 'Services', 'Engagement', 'Content', 'Education', 'Health', 'Organizations', 'AI & Tech', 'Custom'];

export default function NewProjectPage() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectName, setProjectName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#10b981');
  const [prompt, setPrompt] = useState('');

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/projects/new');
    }
  }, [status, router]);

  // tRPC mutation for creating projects
  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      // Redirect to project page with params for generation
      const params = new URLSearchParams({
        template: selectedTemplate || 'base',
        name: projectName,
        bundleId: bundleId || `com.app.${projectName.toLowerCase().replace(/\s+/g, '')}`,
        primaryColor,
        secondaryColor,
        prompt: encodeURIComponent(prompt),
      });
      router.push(`/projects/${project.id}?${params.toString()}`);
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    },
  });

  const steps: { key: Step; label: string }[] = [
    { key: 'template', label: 'Template' },
    { key: 'details', label: 'Details' },
    { key: 'branding', label: 'Branding' },
    { key: 'prompt', label: 'Customize' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'template':
        return selectedTemplate !== null;
      case 'details':
        return projectName.trim().length > 0;
      case 'branding':
        return true;
      case 'prompt':
        return prompt.trim().length > 0;
      default:
        return false;
    }
  };

  const handleCreate = async () => {
    const generatedBundleId = bundleId || `com.app.${projectName.toLowerCase().replace(/\s+/g, '')}`;

    createProject.mutate({
      name: projectName,
      templateId: selectedTemplate || 'base',
      bundleIdIos: generatedBundleId,
      bundleIdAndroid: generatedBundleId.replace(/\./g, '_'),
      branding: {
        primaryColor,
        secondaryColor,
      },
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Create New Project
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {steps.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStepIndex
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 mx-4 bg-slate-200 dark:bg-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step 1: Template Selection */}
          {step === 'template' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Choose a Template
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Select a starting point for your app. You can customize everything later.
              </p>

              {/* Search Input */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-800"
                />
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => {
                  const count = category === 'All'
                    ? templates.length
                    : templates.filter(t => t.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Templates Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No templates found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-6 rounded-lg border-2 text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-4xl">{template.icon}</span>
                        <span className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full">
                          {template.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.slice(0, 3).map((feature) => (
                          <span
                            key={feature}
                            className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 'details' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Project Details
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Give your app a name and identifier.
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    App Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bundle ID (optional)
                  </label>
                  <input
                    type="text"
                    value={bundleId}
                    onChange={(e) => setBundleId(e.target.value)}
                    placeholder="com.company.appname"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Used for iOS and Android app stores. We'll generate one if left empty.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {step === 'branding' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Brand Colors
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Choose your app's color scheme.
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-12 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Preview
                  </p>
                  <div className="flex gap-4">
                    <button
                      style={{ backgroundColor: primaryColor }}
                      className="px-6 py-2 text-white rounded-lg font-medium"
                    >
                      Primary Button
                    </button>
                    <button
                      style={{ backgroundColor: secondaryColor }}
                      className="px-6 py-2 text-white rounded-lg font-medium"
                    >
                      Secondary Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Customization Prompt */}
          {step === 'prompt' && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Describe Your App
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Tell us what you want to build. Be as specific as possible about features and
                functionality.
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Example: I want a ${
                    selectedTemplate === 'loyalty'
                      ? 'coffee shop loyalty app where customers can earn points for purchases, redeem rewards, and track their tier status'
                      : selectedTemplate === 'ecommerce'
                      ? 'fashion store app with product categories, a wishlist feature, and Apple Pay checkout'
                      : selectedTemplate === 'news'
                      ? 'tech news app with breaking news alerts, topic filtering, and offline reading'
                      : 'custom app with...'
                  }`}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-900 resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  The AI will analyze your request and customize the {selectedTemplate} template
                  accordingly.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {step === 'prompt' ? (
              <button
                onClick={handleCreate}
                disabled={!canProceed() || createProject.isPending}
                className="px-8 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createProject.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    Create App
                    <span>→</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
