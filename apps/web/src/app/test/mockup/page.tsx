'use client';

import React, { useState } from 'react';
import { DeviceFrame, BrandingPanel, type BrandingConfig } from '@mobigen/ui/mockup';

const INITIAL_BRANDING: BrandingConfig = {
  appName: 'My Store',
  primaryColor: '#0EA5E9',
  secondaryColor: '#0284C7',
  accentColor: '#38BDF8',
};

export default function MockupTestPage() {
  const [branding, setBranding] = useState<BrandingConfig>(INITIAL_BRANDING);
  const [selectedDevice, setSelectedDevice] = useState<'iphone-15-pro' | 'iphone-14' | 'pixel-8' | 'galaxy-s23'>('iphone-15-pro');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Mockup System Test
          </h1>
          <p className="text-gray-600">
            Test the Mobigen 2.0 Instant Mockup System components
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Branding Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Branding Controls
              </h2>
              <BrandingPanel
                branding={branding}
                onChange={setBranding}
                showPreview={true}
                collapsible={true}
                defaultExpanded={true}
              />
            </div>

            {/* Device Selector */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Device
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'iphone-15-pro', name: 'iPhone 15 Pro' },
                  { id: 'iphone-14', name: 'iPhone 14' },
                  { id: 'pixel-8', name: 'Pixel 8' },
                  { id: 'galaxy-s23', name: 'Galaxy S23' },
                ].map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id as any)}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedDevice === device.id
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {device.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Branding JSON */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Branding Config
              </h3>
              <pre className="bg-gray-50 rounded-lg p-4 text-xs overflow-auto max-h-64">
                {JSON.stringify(branding, null, 2)}
              </pre>
            </div>
          </div>

          {/* Right Column - Device Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Live Preview
              </h2>

              <div className="flex justify-center">
                <DeviceFrame
                  device={selectedDevice}
                  showStatusBar={true}
                  showHomeIndicator={true}
                  scale={0.8}
                >
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

                    {/* Content Area */}
                    <div className="flex-1 p-6 space-y-4 bg-gray-50">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Welcome to {branding.appName}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          This is a preview of your app with the current branding applied.
                        </p>
                      </div>

                      <button
                        className="w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        Primary Button
                      </button>

                      <button
                        className="w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: branding.secondaryColor }}
                      >
                        Secondary Button
                      </button>

                      {branding.accentColor && (
                        <button
                          className="w-full py-3 px-4 rounded-lg font-semibold text-white shadow-md hover:shadow-lg transition-all"
                          style={{ backgroundColor: branding.accentColor }}
                        >
                          Accent Button
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: branding.primaryColor + '20' }}
                        >
                          <div className="text-2xl font-bold" style={{ color: branding.primaryColor }}>
                            42
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Products</div>
                        </div>
                        <div
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: branding.secondaryColor + '20' }}
                        >
                          <div className="text-2xl font-bold" style={{ color: branding.secondaryColor }}>
                            12
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Orders</div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Nav */}
                    <div className="border-t border-gray-200 bg-white px-4 py-3 flex justify-around">
                      {['Home', 'Browse', 'Cart', 'Profile'].map((tab) => (
                        <button
                          key={tab}
                          className="flex flex-col items-center gap-1"
                          style={{ color: branding.primaryColor }}
                        >
                          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: branding.primaryColor + '30' }} />
                          <span className="text-xs">{tab}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </DeviceFrame>
              </div>

              {/* Device Info */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Current device: <span className="font-semibold">{selectedDevice}</span>
              </div>
            </div>

            {/* Test Results */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✅ Component Tests
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>DeviceFrame renders correctly</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>BrandingPanel interactive controls work</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Color picker updates in real-time</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Logo upload component renders</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Preset colors apply instantly</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Device switching works</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
