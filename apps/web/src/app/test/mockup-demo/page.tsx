'use client';

import React, { useState } from 'react';
import { DeviceFrame, BrandingPanel, type BrandingConfig, type DeviceType } from '@mobigen/ui/mockup';

const TEMPLATES = [
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    icon: '🛍️',
    description: 'Online store with products, cart, and checkout',
    screens: [
      { id: 'home', name: 'Home', emoji: '🏠' },
      { id: 'categories', name: 'Categories', emoji: '📂' },
      { id: 'cart', name: 'Cart', emoji: '🛒' },
      { id: 'profile', name: 'Profile', emoji: '👤' },
    ],
  },
  {
    id: 'loyalty',
    name: 'Loyalty & Rewards',
    icon: '🎁',
    description: 'Points, rewards, and member tiers',
    screens: [
      { id: 'home', name: 'Home', emoji: '🏠' },
      { id: 'rewards', name: 'Rewards', emoji: '🎁' },
      { id: 'scan', name: 'Scan', emoji: '📷' },
      { id: 'profile', name: 'Profile', emoji: '👤' },
    ],
  },
];

const INITIAL_BRANDING: BrandingConfig = {
  appName: 'My Awesome App',
  primaryColor: '#0EA5E9',
  secondaryColor: '#0284C7',
  accentColor: '#38BDF8',
};

export default function MockupDemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [selectedScreen, setSelectedScreen] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('iphone-15-pro');
  const [branding, setBranding] = useState<BrandingConfig>(INITIAL_BRANDING);
  const [showBrandingPanel, setShowBrandingPanel] = useState(true);

  const currentScreen = selectedTemplate.screens[selectedScreen];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mobigen 2.0 Instant Mockup System
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            From idea to visual mockup in <span className="font-bold text-purple-600">0-3 seconds</span>
          </p>
          <div className="inline-flex gap-2 bg-white rounded-full px-6 py-3 shadow-lg">
            <span className="text-green-600 font-semibold">✓ Live Preview</span>
            <span className="text-gray-300">•</span>
            <span className="text-green-600 font-semibold">✓ Instant Branding</span>
            <span className="text-gray-300">•</span>
            <span className="text-green-600 font-semibold">✓ Multi-Device</span>
          </div>
        </div>

        {/* Template Selector */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Select Template</h2>
          <div className="grid grid-cols-2 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template);
                  setSelectedScreen(0);
                }}
                className={`p-6 rounded-2xl border-2 transition-all text-left ${
                  selectedTemplate.id === template.id
                    ? 'border-purple-600 bg-purple-50 shadow-xl scale-105'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-5xl">{template.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {template.screens.map((screen) => (
                    <span key={screen.id} className="text-lg" title={screen.name}>
                      {screen.emoji}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: Branding Controls */}
          <div className="xl:col-span-1 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">2. Customize Branding</h2>
              <button
                onClick={() => setShowBrandingPanel(!showBrandingPanel)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {showBrandingPanel ? 'Hide' : 'Show'}
              </button>
            </div>

            {showBrandingPanel && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <BrandingPanel
                  branding={branding}
                  onChange={setBranding}
                  showPreview={false}
                  collapsible={true}
                  defaultExpanded={true}
                />
              </div>
            )}

            {/* Device Selector */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Select Device</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', emoji: '📱' },
                  { id: 'iphone-14', name: 'iPhone 14', emoji: '📱' },
                  { id: 'pixel-8', name: 'Pixel 8', emoji: '📱' },
                  { id: 'galaxy-s23', name: 'Galaxy S23', emoji: '📱' },
                ].map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id as DeviceType)}
                    className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      selectedDevice === device.id
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{device.emoji}</span>
                    <span className="text-sm">{device.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">System Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Render Time:</span>
                  <span className="font-bold text-xl">0.3s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Components:</span>
                  <span className="font-bold text-xl">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Screens:</span>
                  <span className="font-bold text-xl">{selectedTemplate.screens.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-90">Device Support:</span>
                  <span className="font-bold text-xl">4</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Device Preview + Screen Navigator */}
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">3. Preview & Navigate</h2>

            {/* Screen Navigator */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Screen Navigator</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedTemplate.screens.map((screen, index) => (
                  <button
                    key={screen.id}
                    onClick={() => setSelectedScreen(index)}
                    className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      selectedScreen === index
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-2xl">{screen.emoji}</span>
                    <span>{screen.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Device Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-center">
                <DeviceFrame device={selectedDevice} scale={0.75}>
                  {/* Demo App Content */}
                  <div className="h-full flex flex-col">
                    {/* App Header */}
                    <div
                      className="px-6 py-4 flex items-center gap-3"
                      style={{ backgroundColor: branding.primaryColor }}
                    >
                      {branding.logo ? (
                        <img
                          src={branding.logo.url}
                          alt="Logo"
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xl"
                        >
                          {branding.appName.charAt(0)}
                        </div>
                      )}
                      <h1 className="text-xl font-bold text-white">
                        {branding.appName}
                      </h1>
                    </div>

                    {/* Screen Content */}
                    <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {currentScreen.name}
                        </h2>
                        <p className="text-gray-600 text-sm mb-4">
                          Screen {selectedScreen + 1} of {selectedTemplate.screens.length}
                        </p>
                      </div>

                      {/* Template-specific content */}
                      {selectedTemplate.id === 'ecommerce' && currentScreen.id === 'home' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            {['Premium Headphones', 'Wireless Mouse', 'Laptop Stand', 'USB-C Cable'].map((product, i) => (
                              <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="w-full h-24 bg-gray-200 rounded-md mb-2"></div>
                                <h3 className="text-sm font-semibold mb-1">{product}</h3>
                                <p className="text-sm font-bold" style={{ color: branding.primaryColor }}>
                                  ${(29.99 + i * 20).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTemplate.id === 'loyalty' && currentScreen.id === 'home' && (
                        <div className="space-y-4">
                          <div
                            className="rounded-2xl p-6 text-white text-center"
                            style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
                          >
                            <h3 className="text-lg mb-2">Your Points</h3>
                            <div className="text-5xl font-bold mb-2">2,450</div>
                            <p className="text-sm opacity-90">≈ $24.50 in rewards</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['📷 Scan', '🎁 Rewards', '📊 History'].map((action, i) => (
                              <button
                                key={i}
                                className="bg-white rounded-lg p-4 text-center shadow-sm"
                              >
                                <div className="text-2xl mb-1">{action.split(' ')[0]}</div>
                                <div className="text-xs font-semibold">{action.split(' ')[1]}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Generic content for other screens */}
                      {!((selectedTemplate.id === 'ecommerce' && currentScreen.id === 'home') ||
                          (selectedTemplate.id === 'loyalty' && currentScreen.id === 'home')) && (
                        <div className="space-y-3">
                          <button
                            className="w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md"
                            style={{ backgroundColor: branding.primaryColor }}
                          >
                            Primary Action
                          </button>
                          <button
                            className="w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md"
                            style={{ backgroundColor: branding.secondaryColor }}
                          >
                            Secondary Action
                          </button>
                          {branding.accentColor && (
                            <button
                              className="w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md"
                              style={{ backgroundColor: branding.accentColor }}
                            >
                              Accent Action
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Navigation */}
                    <div className="border-t border-gray-200 bg-white px-4 py-3 flex justify-around">
                      {selectedTemplate.screens.map((screen, index) => (
                        <button
                          key={screen.id}
                          onClick={() => setSelectedScreen(index)}
                          className="flex flex-col items-center gap-1"
                          style={{ color: selectedScreen === index ? branding.primaryColor : '#9CA3AF' }}
                        >
                          <span className="text-2xl">{screen.emoji}</span>
                          <span className="text-xs font-medium">{screen.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </DeviceFrame>
              </div>

              {/* Device Info */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Current device: <span className="font-semibold">{selectedDevice}</span>
                </p>
              </div>
            </div>

            {/* Features Showcase */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '⚡', label: 'Instant', desc: '<3s render' },
                { icon: '🎨', label: 'Dynamic', desc: 'Live branding' },
                { icon: '📱', label: 'Responsive', desc: '4 devices' },
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-4 text-center">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h4 className="font-bold text-gray-900">{feature.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Mobigen 2.0 Instant Mockup System • Built with React + TypeScript + Tailwind</p>
          <p className="mt-2">
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ All Components Operational
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
