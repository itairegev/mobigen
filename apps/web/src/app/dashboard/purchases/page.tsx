'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Package, Download, ExternalLink, Calendar } from 'lucide-react';

// Type for purchased template from API
type Purchase = {
  id: string;
  licenseKey: string;
  licenseType: string;
  createdAt: Date;
  template: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    thumbnailUrl: string | null;
    tier: string;
    category: { name: string } | null;
    publisher: { name: string | null } | null;
  };
};

export default function PurchasesPage() {
  const { data: purchases, isLoading } = trpc.marketplace.getUserPurchases.useQuery() as {
    data: Purchase[] | undefined;
    isLoading: boolean;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          My Purchased Templates
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Access and manage all your purchased templates
        </p>
      </div>

      {!purchases || purchases.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No purchases yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Browse the marketplace to find templates for your projects
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Template Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                {purchase.template.thumbnailUrl ? (
                  <img
                    src={purchase.template.thumbnailUrl}
                    alt={purchase.template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-6xl">📱</span>
                  </div>
                )}

                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                    Owned
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {purchase.template.category?.name}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {purchase.template.name}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {purchase.template.shortDescription}
                </p>

                {/* Purchase Info */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Purchased {new Date(purchase.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* License Info */}
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">License:</span>
                    <span className="font-medium text-slate-900 dark:text-white capitalize">
                      {purchase.licenseType}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Key: <code className="font-mono">{purchase.licenseKey}</code>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/marketplace/${purchase.template.slug}`}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors text-center"
                  >
                    View Details
                  </Link>
                  <button
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    title="Download Template"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {purchases && purchases.length > 0 && (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Purchase Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {purchases.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Templates
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {purchases.filter((p) => p.template.tier === 'premium').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Premium Templates
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {purchases.filter((p) => p.licenseType === 'enterprise').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Enterprise Licenses
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
