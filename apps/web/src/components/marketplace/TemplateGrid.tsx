import { TemplateCard } from './TemplateCard';

interface Template {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  thumbnailUrl?: string | null;
  tier: 'free' | 'premium' | 'enterprise' | string;
  price: number;
  currency: string;
  averageRating: number;
  totalRatings: number;
  downloadCount: number;
  category?: {
    name: string;
    slug: string;
  } | null;
  _count?: {
    purchases: number;
    reviews: number;
  };
  publisher?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface TemplateGridProps {
  templates: Template[];
  loading?: boolean;
  emptyMessage?: string;
}

export function TemplateGrid({
  templates,
  loading = false,
  emptyMessage = 'No templates found',
}: TemplateGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="p-5">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2 w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4 w-2/3" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          {emptyMessage}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <TemplateCard key={template.id} {...template} />
      ))}
    </div>
  );
}
