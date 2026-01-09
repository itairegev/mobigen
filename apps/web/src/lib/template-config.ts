/**
 * Template Configuration Definitions
 *
 * Defines what information each template needs before generation.
 * Used by the chat-based configuration flow.
 */

export type ConfigFieldType =
  | 'text'
  | 'url'
  | 'select'
  | 'color'
  | 'boolean'
  | 'api_key';

export interface ConfigField {
  id: string;
  label: string;
  type: ConfigFieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    validator?: 'shopify_store' | 'api_key' | 'url';
  };
  options?: { value: string; label: string }[];
  defaultValue?: string;
  envVar?: string; // The environment variable this maps to
}

export interface TemplateConfigStep {
  id: string;
  title: string;
  message: string; // The chat message to display
  fields: ConfigField[];
  skipCondition?: string; // Field ID that if truthy, skips this step
}

export interface TemplateConfig {
  templateId: string;
  welcomeMessage: string;
  steps: TemplateConfigStep[];
  completionMessage: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEMPLATE CONFIGURATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {

  // E-COMMERCE TEMPLATE
  'ecommerce': {
    templateId: 'ecommerce',
    welcomeMessage: "Let's set up your e-commerce app! I'll need a few details to connect it to your store.",
    steps: [
      {
        id: 'store_setup',
        title: 'Connect Your Store',
        message: "Do you have a Shopify store? If so, I can pull in your real products automatically!",
        fields: [
          {
            id: 'has_shopify',
            label: 'I have a Shopify store',
            type: 'boolean',
            required: false,
            defaultValue: 'false',
          },
        ],
      },
      {
        id: 'shopify_config',
        title: 'Shopify Store',
        message: "What's your Shopify store domain? (e.g., mystore.myshopify.com or just 'mystore')",
        fields: [
          {
            id: 'shopify_store',
            label: 'Shopify Store Domain',
            type: 'text',
            placeholder: 'mystore',
            helpText: "Just enter the store name, not the full URL",
            required: true,
            validation: {
              validator: 'shopify_store',
              minLength: 2,
              maxLength: 50,
            },
            envVar: 'EXPO_PUBLIC_SHOPIFY_STORE',
          },
        ],
        skipCondition: 'has_shopify', // Only show if has_shopify is true
      },
      {
        id: 'branding',
        title: 'Store Branding',
        message: "What's your store called? And what are your brand colors?",
        fields: [
          {
            id: 'store_name',
            label: 'Store Name',
            type: 'text',
            placeholder: 'My Awesome Store',
            required: true,
          },
          {
            id: 'primary_color',
            label: 'Primary Color',
            type: 'color',
            defaultValue: '#0066FF',
            required: false,
          },
        ],
      },
    ],
    completionMessage: "Your e-commerce app is configured and ready to build!",
  },

  // AI ASSISTANT TEMPLATE
  'ai-assistant': {
    templateId: 'ai-assistant',
    welcomeMessage: "Let's create your AI assistant! I'll help you set up the AI integration.",
    steps: [
      {
        id: 'ai_provider',
        title: 'AI Provider',
        message: "Which AI would you like to power your assistant?",
        fields: [
          {
            id: 'ai_provider',
            label: 'AI Provider',
            type: 'select',
            options: [
              { value: 'anthropic', label: 'Claude (Anthropic) - Recommended' },
              { value: 'openai', label: 'ChatGPT (OpenAI)' },
              { value: 'demo', label: 'Demo Mode (No API key needed)' },
            ],
            required: true,
            defaultValue: 'demo',
          },
        ],
      },
      {
        id: 'anthropic_key',
        title: 'Anthropic API Key',
        message: "Enter your Anthropic API key. You can get one at console.anthropic.com",
        fields: [
          {
            id: 'anthropic_api_key',
            label: 'Anthropic API Key',
            type: 'api_key',
            placeholder: 'sk-ant-...',
            required: true,
            validation: {
              pattern: '^sk-ant-',
              validator: 'api_key',
            },
            envVar: 'EXPO_PUBLIC_ANTHROPIC_API_KEY',
          },
        ],
        skipCondition: 'ai_provider', // Only show if ai_provider === 'anthropic'
      },
      {
        id: 'openai_key',
        title: 'OpenAI API Key',
        message: "Enter your OpenAI API key. You can get one at platform.openai.com",
        fields: [
          {
            id: 'openai_api_key',
            label: 'OpenAI API Key',
            type: 'api_key',
            placeholder: 'sk-...',
            required: true,
            validation: {
              pattern: '^sk-',
              validator: 'api_key',
            },
            envVar: 'EXPO_PUBLIC_OPENAI_API_KEY',
          },
        ],
        skipCondition: 'ai_provider', // Only show if ai_provider === 'openai'
      },
      {
        id: 'assistant_persona',
        title: 'Assistant Persona',
        message: "What kind of assistant is this? Give it a name and describe its personality.",
        fields: [
          {
            id: 'assistant_name',
            label: 'Assistant Name',
            type: 'text',
            placeholder: 'Alex',
            required: true,
          },
          {
            id: 'assistant_role',
            label: 'Assistant Role',
            type: 'text',
            placeholder: 'A helpful coding tutor that explains concepts simply',
            required: true,
          },
        ],
      },
    ],
    completionMessage: "Your AI assistant is configured! Let's build it.",
  },

  // NEWS TEMPLATE
  'news': {
    templateId: 'news',
    welcomeMessage: "Let's set up your news app! I'll configure the news sources.",
    steps: [
      {
        id: 'news_source',
        title: 'News Source',
        message: "Do you have a news API key? Or would you like to use demo content?",
        fields: [
          {
            id: 'news_mode',
            label: 'News Source',
            type: 'select',
            options: [
              { value: 'demo', label: 'Demo Mode (Sample news content)' },
              { value: 'gnews', label: 'GNews API (Free tier: 100 requests/day)' },
              { value: 'currents', label: 'Currents API (Free tier available)' },
            ],
            required: true,
            defaultValue: 'demo',
          },
        ],
      },
      {
        id: 'gnews_key',
        title: 'GNews API Key',
        message: "Enter your GNews API key. Get one free at gnews.io",
        fields: [
          {
            id: 'gnews_api_key',
            label: 'GNews API Key',
            type: 'api_key',
            placeholder: 'Your GNews API key',
            required: true,
            envVar: 'EXPO_PUBLIC_GNEWS_API_KEY',
          },
        ],
        skipCondition: 'news_mode', // Only show if news_mode === 'gnews'
      },
      {
        id: 'news_categories',
        title: 'News Categories',
        message: "What topics should your app focus on?",
        fields: [
          {
            id: 'default_category',
            label: 'Primary Category',
            type: 'select',
            options: [
              { value: 'general', label: 'General News' },
              { value: 'technology', label: 'Technology' },
              { value: 'business', label: 'Business' },
              { value: 'sports', label: 'Sports' },
              { value: 'entertainment', label: 'Entertainment' },
              { value: 'health', label: 'Health' },
              { value: 'science', label: 'Science' },
            ],
            required: true,
            defaultValue: 'general',
          },
        ],
      },
    ],
    completionMessage: "Your news app is ready to generate!",
  },

  // RESTAURANT TEMPLATE
  'restaurant': {
    templateId: 'restaurant',
    welcomeMessage: "Let's create your restaurant app! Tell me about your restaurant.",
    steps: [
      {
        id: 'restaurant_info',
        title: 'Restaurant Details',
        message: "What's your restaurant called?",
        fields: [
          {
            id: 'restaurant_name',
            label: 'Restaurant Name',
            type: 'text',
            placeholder: "Joe's Pizza",
            required: true,
          },
          {
            id: 'cuisine_type',
            label: 'Cuisine Type',
            type: 'select',
            options: [
              { value: 'american', label: 'American' },
              { value: 'italian', label: 'Italian' },
              { value: 'mexican', label: 'Mexican' },
              { value: 'asian', label: 'Asian' },
              { value: 'indian', label: 'Indian' },
              { value: 'mediterranean', label: 'Mediterranean' },
              { value: 'other', label: 'Other' },
            ],
            required: true,
          },
        ],
      },
      {
        id: 'menu_source',
        title: 'Menu Source',
        message: "Would you like to use sample menu items, or describe your menu?",
        fields: [
          {
            id: 'menu_mode',
            label: 'Menu Mode',
            type: 'select',
            options: [
              { value: 'sample', label: 'Use sample menu (can customize later)' },
              { value: 'describe', label: "I'll describe my menu items" },
            ],
            required: true,
            defaultValue: 'sample',
          },
        ],
      },
    ],
    completionMessage: "Your restaurant app is configured!",
  },

  // FITNESS TEMPLATE
  'fitness': {
    templateId: 'fitness',
    welcomeMessage: "Let's build your fitness app! I'll set up the exercise database.",
    steps: [
      {
        id: 'fitness_focus',
        title: 'Fitness Focus',
        message: "What type of workouts will your app focus on?",
        fields: [
          {
            id: 'workout_type',
            label: 'Primary Workout Type',
            type: 'select',
            options: [
              { value: 'general', label: 'General Fitness (All workouts)' },
              { value: 'strength', label: 'Strength Training' },
              { value: 'cardio', label: 'Cardio & HIIT' },
              { value: 'yoga', label: 'Yoga & Flexibility' },
              { value: 'bodyweight', label: 'Bodyweight / No Equipment' },
            ],
            required: true,
            defaultValue: 'general',
          },
        ],
      },
      {
        id: 'fitness_branding',
        title: 'App Branding',
        message: "What should your fitness app be called?",
        fields: [
          {
            id: 'app_name',
            label: 'App Name',
            type: 'text',
            placeholder: 'FitLife',
            required: true,
          },
        ],
      },
    ],
    completionMessage: "Your fitness app is ready to build!",
  },

  // PODCAST TEMPLATE
  'podcast': {
    templateId: 'podcast',
    welcomeMessage: "Let's create your podcast app! Tell me about your show.",
    steps: [
      {
        id: 'podcast_source',
        title: 'Podcast Source',
        message: "Do you have an RSS feed for your podcast? Most podcast hosts provide one.",
        fields: [
          {
            id: 'podcast_mode',
            label: 'Podcast Source',
            type: 'select',
            options: [
              { value: 'demo', label: 'Demo Mode (Sample episodes)' },
              { value: 'rss', label: 'Use my RSS feed' },
            ],
            required: true,
            defaultValue: 'demo',
            envVar: 'EXPO_PUBLIC_PODCAST_MODE',
          },
        ],
      },
      {
        id: 'rss_config',
        title: 'RSS Feed',
        message: "Enter your podcast RSS feed URL. You can find this in your podcast hosting dashboard (Anchor, Buzzsprout, etc.)",
        fields: [
          {
            id: 'podcast_rss_url',
            label: 'RSS Feed URL',
            type: 'url',
            placeholder: 'https://feeds.example.com/my-podcast',
            helpText: 'The RSS feed URL from your podcast host',
            required: true,
            validation: {
              validator: 'url',
              pattern: '^https?://',
            },
            envVar: 'EXPO_PUBLIC_PODCAST_RSS_URL',
          },
        ],
        skipCondition: 'podcast_mode', // Only show if podcast_mode === 'rss'
      },
      {
        id: 'podcast_branding',
        title: 'App Branding',
        message: "What should your podcast app be called?",
        fields: [
          {
            id: 'podcast_name',
            label: 'Podcast Name',
            type: 'text',
            placeholder: 'My Awesome Podcast',
            required: true,
            envVar: 'EXPO_PUBLIC_PODCAST_NAME',
          },
        ],
      },
    ],
    completionMessage: "Your podcast app is configured!",
  },

  // LOYALTY TEMPLATE
  'loyalty': {
    templateId: 'loyalty',
    welcomeMessage: "Let's create your loyalty program app! Tell me about your rewards system.",
    steps: [
      {
        id: 'business_info',
        title: 'Business Info',
        message: "What's your business called?",
        fields: [
          {
            id: 'business_name',
            label: 'Business Name',
            type: 'text',
            placeholder: 'Coffee Corner',
            required: true,
          },
          {
            id: 'business_type',
            label: 'Business Type',
            type: 'select',
            options: [
              { value: 'cafe', label: 'Cafe / Coffee Shop' },
              { value: 'restaurant', label: 'Restaurant' },
              { value: 'retail', label: 'Retail Store' },
              { value: 'salon', label: 'Salon / Spa' },
              { value: 'other', label: 'Other' },
            ],
            required: true,
          },
        ],
      },
      {
        id: 'rewards_config',
        title: 'Rewards Setup',
        message: "How should your rewards program work?",
        fields: [
          {
            id: 'points_per_dollar',
            label: 'Points per $1 spent',
            type: 'select',
            options: [
              { value: '1', label: '1 point per $1' },
              { value: '2', label: '2 points per $1' },
              { value: '5', label: '5 points per $1' },
              { value: '10', label: '10 points per $1' },
            ],
            required: true,
            defaultValue: '1',
          },
          {
            id: 'reward_threshold',
            label: 'Points for reward',
            type: 'select',
            options: [
              { value: '50', label: '50 points = Free item' },
              { value: '100', label: '100 points = Free item' },
              { value: '200', label: '200 points = Free item' },
            ],
            required: true,
            defaultValue: '100',
          },
        ],
      },
    ],
    completionMessage: "Your loyalty program is configured!",
  },

  // SERVICE BOOKING TEMPLATE
  'service-booking': {
    templateId: 'service-booking',
    welcomeMessage: "Let's create your booking app! Tell me about your business.",
    steps: [
      {
        id: 'business_info',
        title: 'Business Info',
        message: "What's your business called?",
        fields: [
          {
            id: 'business_name',
            label: 'Business Name',
            type: 'text',
            placeholder: 'Wellness Spa',
            required: true,
            envVar: 'EXPO_PUBLIC_BUSINESS_NAME',
          },
        ],
      },
      {
        id: 'business_type',
        title: 'Business Type',
        message: "What type of services do you offer?",
        fields: [
          {
            id: 'service_type',
            label: 'Service Type',
            type: 'select',
            options: [
              { value: 'spa', label: 'Spa & Wellness' },
              { value: 'salon', label: 'Hair Salon / Barber' },
              { value: 'fitness', label: 'Personal Training / Fitness' },
              { value: 'medical', label: 'Medical / Dental' },
              { value: 'consulting', label: 'Consulting / Coaching' },
              { value: 'other', label: 'Other Service' },
            ],
            required: true,
            defaultValue: 'spa',
          },
        ],
      },
      {
        id: 'business_hours',
        title: 'Business Hours',
        message: "What are your operating hours?",
        fields: [
          {
            id: 'hours_start',
            label: 'Opening Time',
            type: 'select',
            options: [
              { value: '08:00', label: '8:00 AM' },
              { value: '09:00', label: '9:00 AM' },
              { value: '10:00', label: '10:00 AM' },
            ],
            required: true,
            defaultValue: '09:00',
            envVar: 'EXPO_PUBLIC_BUSINESS_HOURS_START',
          },
          {
            id: 'hours_end',
            label: 'Closing Time',
            type: 'select',
            options: [
              { value: '17:00', label: '5:00 PM' },
              { value: '18:00', label: '6:00 PM' },
              { value: '19:00', label: '7:00 PM' },
              { value: '20:00', label: '8:00 PM' },
              { value: '21:00', label: '9:00 PM' },
            ],
            required: true,
            defaultValue: '18:00',
            envVar: 'EXPO_PUBLIC_BUSINESS_HOURS_END',
          },
        ],
      },
    ],
    completionMessage: "Your booking app is ready! Your clients will love it.",
  },

  // SPORTS TEAM TEMPLATE
  'sports-team': {
    templateId: 'sports-team',
    welcomeMessage: "Let's create your sports team app! Tell me about your team.",
    steps: [
      {
        id: 'team_info',
        title: 'Team Info',
        message: "What's your team called? I can look up real game schedules and player info!",
        fields: [
          {
            id: 'team_name',
            label: 'Team Name',
            type: 'text',
            placeholder: 'Manchester United',
            helpText: 'Enter your team name (e.g., "Lakers", "Chelsea", "Patriots")',
            required: true,
            envVar: 'EXPO_PUBLIC_TEAM_NAME',
          },
        ],
      },
      {
        id: 'sport_type',
        title: 'Sport Type',
        message: "What sport does your team play?",
        fields: [
          {
            id: 'sport_type',
            label: 'Sport',
            type: 'select',
            options: [
              { value: 'soccer', label: 'Soccer / Football' },
              { value: 'basketball', label: 'Basketball' },
              { value: 'football', label: 'American Football' },
              { value: 'baseball', label: 'Baseball' },
              { value: 'hockey', label: 'Hockey' },
            ],
            required: true,
            defaultValue: 'soccer',
            envVar: 'EXPO_PUBLIC_SPORT_TYPE',
          },
        ],
      },
      {
        id: 'data_source',
        title: 'Data Source',
        message: "Should I fetch real game schedules and player data, or use demo content?",
        fields: [
          {
            id: 'sports_mode',
            label: 'Data Source',
            type: 'select',
            options: [
              { value: 'api', label: 'Real Data (from TheSportsDB)' },
              { value: 'demo', label: 'Demo Mode (Sample data)' },
            ],
            required: true,
            defaultValue: 'api',
            envVar: 'EXPO_PUBLIC_SPORTS_MODE',
          },
        ],
      },
    ],
    completionMessage: "Your sports team app is ready to build! Go team! 🏆",
  },
};

// Default config for templates without specific configuration
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  templateId: 'default',
  welcomeMessage: "Let's set up your app! Just a few quick questions.",
  steps: [
    {
      id: 'app_info',
      title: 'App Info',
      message: "What should your app be called?",
      fields: [
        {
          id: 'app_name',
          label: 'App Name',
          type: 'text',
          placeholder: 'My App',
          required: true,
        },
      ],
    },
  ],
  completionMessage: "Your app is ready to generate!",
};

/**
 * Get configuration for a template
 */
export function getTemplateConfig(templateId: string): TemplateConfig {
  return TEMPLATE_CONFIGS[templateId] || {
    ...DEFAULT_TEMPLATE_CONFIG,
    templateId,
  };
}

/**
 * Check if a step should be shown based on skip conditions
 */
export function shouldShowStep(
  step: TemplateConfigStep,
  values: Record<string, string>
): boolean {
  if (!step.skipCondition) return true;

  // Special handling for conditional steps
  const conditionValue = values[step.skipCondition];

  // For boolean fields (like has_shopify)
  if (conditionValue === 'true' || conditionValue === 'false') {
    // Show if condition is true
    return conditionValue === 'true';
  }

  // For select fields (like ai_provider)
  // The step ID often contains the expected value
  const stepIdParts = step.id.split('_');
  const expectedValue = stepIdParts[0]; // e.g., 'anthropic' from 'anthropic_key'

  return conditionValue === expectedValue;
}

/**
 * Get environment variables from config values
 */
export function getEnvVarsFromConfig(
  templateId: string,
  values: Record<string, string>
): Record<string, string> {
  const config = getTemplateConfig(templateId);
  const envVars: Record<string, string> = {};

  for (const step of config.steps) {
    for (const field of step.fields) {
      if (field.envVar && values[field.id]) {
        envVars[field.envVar] = values[field.id];
      }
    }
  }

  return envVars;
}
