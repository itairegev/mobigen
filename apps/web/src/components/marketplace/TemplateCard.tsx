import Link from 'next/link';
import { Star } from 'lucide-react';

interface TemplateCardProps {
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
}

export function TemplateCard({
  id,
  slug,
  name,
  shortDescription,
  thumbnailUrl,
  tier,
  price,
  currency,
  averageRating,
  totalRatings,
  downloadCount,
  category,
}: TemplateCardProps) {
  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(price / 100);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'premium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  return (
    <Link href={`/marketplace/${slug}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group">
        {/* Thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl">📱</span>
            </div>
          )}

          {/* Tier Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTierBadge(tier)}`}>
              {tier}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          {category && (
            <div className="mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {category.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1">
            {name}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
            {shortDescription}
          </p>

          {/* Rating & Downloads */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({totalRatings})
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              {downloadCount.toLocaleString()} downloads
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {formatPrice(price, currency)}
            </span>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
