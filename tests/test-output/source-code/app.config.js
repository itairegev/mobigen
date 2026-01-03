import 'dotenv/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_STAGING = process.env.APP_VARIANT === 'staging';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return {
      ios: 'com.technews.daily.e2e.dev',
      android: 'com.technews.daily.e2e.dev'
    };
  }
  if (IS_STAGING) {
    return {
      ios: 'com.technews.daily.e2e.staging',
      android: 'com.technews.daily.e2e.staging'
    };
  }
  return {
    ios: 'com.technews.daily.e2e',
    android: 'com.technews.daily.e2e'
  };
};

const getAppName = () => {
  if (IS_DEV) return 'TechNews Daily (Dev)';
  if (IS_STAGING) return 'TechNews Daily (Staging)';
  return 'TechNews Daily';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'technews-daily',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier().ios,
      buildNumber: '1'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: getUniqueIdentifier().android,
      versionCode: 1
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-sqlite'
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      projectId: 'cbbb121c-6ef5-4edd-8df6-774c5fe64597',
      easProjectId: 'eas-cbbb121c-6ef5-4edd-8df6-774c5fe64597',
      awsResourcePrefix: 'mobigen-cbbb121c',
      analyticsKey: 'analytics-cbbb121c-6ef5-4edd-8df6-774c5fe64597',
      apiUrl: process.env.API_URL,
      environment: process.env.ENVIRONMENT || 'development',
      primaryColor: '#2563eb',
      secondaryColor: '#059669'
    }
  }
};