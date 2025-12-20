'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

interface UserSettings {
  name: string;
  email: string;
  notifications: {
    email: boolean;
    buildComplete: boolean;
    weeklyReport: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultTemplate: string;
  };
  apiKeys: {
    anthropic: string;
    expo: string;
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'api' | 'usage'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState<UserSettings>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    notifications: {
      email: true,
      buildComplete: true,
      weeklyReport: false,
    },
    preferences: {
      theme: 'system',
      defaultTemplate: 'base',
    },
    apiKeys: {
      anthropic: '',
      expo: '',
    },
  });

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setSaving(false);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
      setSaving(false);
    },
  });

  const updateSettings = trpc.users.updateSettings.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setSaving(false);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
      setSaving(false);
    },
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    updateProfile.mutate({
      name: settings.name,
    });
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setMessage(null);
    updateSettings.mutate({
      notifications: settings.notifications,
    });
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    setMessage(null);
    updateSettings.mutate({
      apiKeys: settings.apiKeys,
    });
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'api', name: 'API Keys', icon: '🔑' },
    { id: 'usage', name: 'Usage & Billing', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Picture
                  </label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                      {settings.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Change
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={settings.email}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Contact support to change your email address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <select
                    value={settings.preferences.theme}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        preferences: { ...settings.preferences, theme: e.target.value as any },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive email notifications</p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            email: !settings.notifications.email,
                          },
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.notifications.email ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Build Complete</h4>
                      <p className="text-sm text-gray-500">
                        Get notified when a build finishes
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            buildComplete: !settings.notifications.buildComplete,
                          },
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.notifications.buildComplete ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.notifications.buildComplete ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Weekly Report</h4>
                      <p className="text-sm text-gray-500">
                        Receive weekly usage summary
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            weeklyReport: !settings.notifications.weeklyReport,
                          },
                        })
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        settings.notifications.weeklyReport ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          settings.notifications.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    API keys are stored securely and encrypted. You can use your own API keys
                    instead of the shared platform keys.
                  </p>
                </div>

                <div>
                  <label htmlFor="anthropic" className="block text-sm font-medium text-gray-700">
                    Anthropic API Key
                  </label>
                  <input
                    type="password"
                    id="anthropic"
                    placeholder="sk-ant-..."
                    value={settings.apiKeys.anthropic}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        apiKeys: { ...settings.apiKeys, anthropic: e.target.value },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for AI-powered code generation
                  </p>
                </div>

                <div>
                  <label htmlFor="expo" className="block text-sm font-medium text-gray-700">
                    Expo Access Token
                  </label>
                  <input
                    type="password"
                    id="expo"
                    placeholder="expo-..."
                    value={settings.apiKeys.expo}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        apiKeys: { ...settings.apiKeys, expo: e.target.value },
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Used for EAS builds (optional)
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveApiKeys}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save API Keys'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">$0.00</p>
                    <p className="text-xs text-gray-500">0 tokens used</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Projects</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Active projects</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Builds</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h3>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm opacity-80">You're on the</p>
                        <p className="text-2xl font-bold">Free Plan</p>
                      </div>
                      <button className="px-4 py-2 bg-white text-indigo-600 rounded-md font-medium hover:bg-gray-100">
                        Upgrade
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="opacity-80">Projects</p>
                        <p className="font-medium">3 / 3</p>
                      </div>
                      <div>
                        <p className="opacity-80">Builds/month</p>
                        <p className="font-medium">10 / 10</p>
                      </div>
                      <div>
                        <p className="opacity-80">Tokens/month</p>
                        <p className="font-medium">100K / 100K</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Usage History</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tokens
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>
                            No usage data yet
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
