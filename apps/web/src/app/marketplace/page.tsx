'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { TemplateGrid, TemplateFilters } from '@/components/marketplace';

type TierType = 'free' | 'premium' | 'enterprise' | undefined;
type SortByType = 'popular' | 'newest' | 'rating' | 'price';

export default function MarketplacePage() {
  const [filters, setFilters] = useState<{
    search: string;
    categoryId: string;
    tier: TierType;
    sortBy: SortByType;
    page: number;
    limit: number;
  }>({
    search: '',
    categoryId: '',
    tier: undefined,
    sortBy: 'popular',
    page: 1,
    limit: 20,
  });

  // Fetch templates with filters
  const { data: templatesData, isLoading: templatesLoading } = trpc.marketplace.listTemplates.useQuery({
    ...filters,
    categoryId: filters.categoryId || undefined,
  });

  // Fetch categories
  const { data: categories = [] } = trpc.marketplace.listCategories.useQuery();

  const handleFilterChange = (newFilters: {
    search?: string;
    categoryId?: string;
    tier?: string;
    sortBy?: string;
  }) => {
    setFilters((prev) => ({
      ...prev,
      search: newFilters.search ?? prev.search,
      categoryId: newFilters.categoryId ?? prev.categoryId,
      tier: (newFilters.tier as TierType) ?? prev.tier,
      sortBy: (newFilters.sortBy as SortByType) ?? prev.sortBy,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Template Marketplace
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Browse and purchase professionally designed mobile app templates
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <TemplateFilters
            categories={categories}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Results Count */}
        {!templatesLoading && templatesData && (
          <div className="mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Showing {templatesData.templates.length} of {templatesData.pagination.total} templates
            </p>
          </div>
        )}

        {/* Templates Grid */}
        <TemplateGrid
          templates={templatesData?.templates || []}
          loading={templatesLoading}
        />

        {/* Pagination */}
        {templatesData && templatesData.pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: templatesData.pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === templatesData.pagination.totalPages ||
                    Math.abs(page - filters.page) <= 2
                )
                .map((page, idx, arr) => (
                  <>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span key={`ellipsis-${page}`} className="px-2 text-slate-400">
                        ...
                      </span>
                    )}
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        filters.page === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  </>
                ))}
            </div>

            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === templatesData.pagination.totalPages}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
