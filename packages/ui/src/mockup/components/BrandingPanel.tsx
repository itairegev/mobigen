import React, { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { LogoUploader, UploadedLogo } from './LogoUploader';
import { BrandingConfig } from '../types';
import { cn } from '../../utils/cn';

export interface BrandingPreset {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
}

export interface BrandingPanelProps {
  branding: BrandingConfig;
  onChange: (branding: BrandingConfig) => void;
  onLogoUpload?: (file: File) => Promise<string>;
  presets?: BrandingPreset[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_PRESETS: BrandingPreset[] = [
  { id: 'ocean', name: 'Ocean Blue', colors: { primary: '#0EA5E9', secondary: '#0284C7', accent: '#38BDF8' } },
  { id: 'forest', name: 'Forest Green', colors: { primary: '#22C55E', secondary: '#16A34A', accent: '#4ADE80' } },
  { id: 'sunset', name: 'Sunset Orange', colors: { primary: '#F97316', secondary: '#EA580C', accent: '#FB923C' } },
  { id: 'royal', name: 'Royal Purple', colors: { primary: '#8B5CF6', secondary: '#7C3AED', accent: '#A78BFA' } },
  { id: 'modern', name: 'Modern Dark', colors: { primary: '#1F2937', secondary: '#111827', accent: '#3B82F6' } },
];

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  collapsible: boolean;
  children: React.ReactNode;
}

function Section({ title, icon, isOpen, onToggle, collapsible, children }: SectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        disabled={!collapsible}
        className={cn(
          'w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors',
          !collapsible && 'cursor-default'
        )}
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-600">{icon}</span>
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {collapsible && (
          <svg className={cn('w-5 h-5 text-gray-500 transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

export function BrandingPanel({
  branding,
  onChange,
  presets = DEFAULT_PRESETS,
  collapsible = true,
  defaultExpanded = true,
  showPreview = false,
  disabled = false,
  className = '',
}: BrandingPanelProps) {
  const [expanded, setExpanded] = useState({
    identity: defaultExpanded,
    colors: defaultExpanded,
    logo: defaultExpanded,
    presets: false,
  });

  const toggle = (section: keyof typeof expanded) => {
    if (collapsible) setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const update = (updates: Partial<BrandingConfig>) => {
    onChange({ ...branding, ...updates });
  };

  const handleLogoChange = (logo: UploadedLogo | null) => {
    update({ logo: logo ? { url: logo.url, width: logo.width, height: logo.height } : undefined });
  };

  const TypeIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>;
  const PaletteIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
  const ImageIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  const SparklesIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

  return (
    <div className={cn('branding-panel space-y-4', className)}>
      <Section title="App Identity" icon={<TypeIcon />} isOpen={expanded.identity} onToggle={() => toggle('identity')} collapsible={collapsible}>
        <div className="space-y-2">
          <label htmlFor="app-name" className="block text-sm font-medium text-gray-700">App Name</label>
          <input
            id="app-name"
            type="text"
            value={branding.appName}
            onChange={(e) => update({ appName: e.target.value })}
            disabled={disabled}
            placeholder="My Awesome App"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </Section>

      <Section title="Brand Colors" icon={<PaletteIcon />} isOpen={expanded.colors} onToggle={() => toggle('colors')} collapsible={collapsible}>
        <div className="space-y-3">
          <ColorPicker label="Primary Color" value={branding.primaryColor} onChange={(color) => update({ primaryColor: color })} disabled={disabled} />
          <ColorPicker label="Secondary Color" value={branding.secondaryColor} onChange={(color) => update({ secondaryColor: color })} disabled={disabled} />
          <ColorPicker label="Accent Color" value={branding.accentColor || branding.primaryColor} onChange={(color) => update({ accentColor: color })} disabled={disabled} />
        </div>
      </Section>

      <Section title="Logo" icon={<ImageIcon />} isOpen={expanded.logo} onToggle={() => toggle('logo')} collapsible={collapsible}>
        <LogoUploader value={branding.logo?.url} onChange={handleLogoChange} disabled={disabled} />
      </Section>

      {presets.length > 0 && (
        <Section title="Quick Presets" icon={<SparklesIcon />} isOpen={expanded.presets} onToggle={() => toggle('presets')} collapsible={collapsible}>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => update({
                  primaryColor: preset.colors.primary,
                  secondaryColor: preset.colors.secondary,
                  accentColor: preset.colors.accent,
                })}
                disabled={disabled}
                className="flex flex-col items-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all disabled:opacity-50"
                type="button"
              >
                <div className="flex gap-1">
                  {[preset.colors.primary, preset.colors.secondary, preset.colors.accent].filter(Boolean).map((color, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">{preset.name}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {showPreview && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: branding.primaryColor }}>
              {branding.logo ? (
                <img src={branding.logo.url} alt="Logo" className="w-8 h-8 rounded" />
              ) : (
                <div className="w-8 h-8 bg-white/20 rounded" />
              )}
              <span className="text-white font-semibold">{branding.appName || 'App Name'}</span>
            </div>
            <button className="w-full py-2 px-4 rounded-md font-medium text-white" style={{ backgroundColor: branding.primaryColor }}>Primary Button</button>
            <button className="w-full py-2 px-4 rounded-md font-medium text-white" style={{ backgroundColor: branding.secondaryColor }}>Secondary Button</button>
          </div>
        </div>
      )}
    </div>
  );
}
