'use client';

import { useState } from 'react';
import { X, CreditCard, Check } from 'lucide-react';

interface PurchaseModalProps {
  template: {
    id: string;
    name: string;
    price: number;
    currency: string;
    tier: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (templateId: string, licenseType: string) => Promise<void>;
}

export function PurchaseModal({ template, isOpen, onClose, onPurchase }: PurchaseModalProps) {
  const [licenseType, setLicenseType] = useState<'single' | 'team' | 'enterprise'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(price / 100);
  };

  const getLicensePrice = () => {
    const multipliers = {
      single: 1,
      team: 3,
      enterprise: 8,
    };
    return template.price * multipliers[licenseType];
  };

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      await onPurchase(template.id, licenseType);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Purchase {template.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* License Type Selection */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Choose License Type
            </h3>

            <div className="space-y-3">
              {/* Single License */}
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  licenseType === 'single'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="license"
                  value="single"
                  checked={licenseType === 'single'}
                  onChange={(e) => setLicenseType(e.target.value as any)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Single Project
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatPrice(getLicensePrice(), template.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Use in one project, single developer
                  </p>
                </div>
              </label>

              {/* Team License */}
              {template.tier !== 'free' && (
                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    licenseType === 'team'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="license"
                    value="team"
                    checked={licenseType === 'team'}
                    onChange={(e) => setLicenseType(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Team License
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatPrice(getLicensePrice(), template.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Up to 5 projects, up to 5 developers
                    </p>
                  </div>
                </label>
              )}

              {/* Enterprise License */}
              {template.tier === 'enterprise' && (
                <label
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    licenseType === 'enterprise'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="license"
                    value="enterprise"
                    checked={licenseType === 'enterprise'}
                    onChange={(e) => setLicenseType(e.target.value as any)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        Enterprise License
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatPrice(getLicensePrice(), template.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Unlimited projects, unlimited developers
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">What's Included</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-green-600" />
                Full template source code
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-green-600" />
                Regular updates and improvements
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-green-600" />
                Priority support
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-green-600" />
                Commercial use allowed
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                {template.price === 0 ? 'Get Template' : 'Purchase Now'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
