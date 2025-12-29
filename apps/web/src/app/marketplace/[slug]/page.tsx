'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { PurchaseModal, ReviewForm } from '@/components/marketplace';
import { Star, Download, CheckCircle, ExternalLink, Clock } from 'lucide-react';

// Type for review from API
type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export default function TemplateDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch template details
  const { data: template, isLoading } = trpc.marketplace.getTemplate.useQuery({ slug });

  // Fetch reviews
  const { data: reviewsData } = trpc.marketplace.getTemplateReviews.useQuery({
    templateId: template?.id || '',
    page: 1,
    limit: 10,
  }, {
    enabled: !!template?.id,
  });

  const utils = trpc.useContext();

  // Purchase mutation
  const purchaseMutation = trpc.marketplace.purchaseTemplate.useMutation({
    onSuccess: () => {
      utils.marketplace.getTemplate.invalidate({ slug });
      utils.marketplace.getUserPurchases.invalidate();
    },
  });

  // Review mutation
  const reviewMutation = trpc.marketplace.submitReview.useMutation({
    onSuccess: () => {
      utils.marketplace.getTemplateReviews.invalidate({ templateId: template?.id || '' });
      utils.marketplace.getTemplate.invalidate({ slug });
      setShowReviewForm(false);
    },
  });

  const handlePurchase = async (templateId: string, licenseType: string) => {
    await purchaseMutation.mutateAsync({ templateId, licenseType: licenseType as any });
  };

  const handleReviewSubmit = async (review: { rating: number; title?: string; comment?: string }) => {
    if (!template) return;
    await reviewMutation.mutateAsync({
      templateId: template.id,
      ...review,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Template Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The template you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(price / 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left: Template Info */}
            <div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {template.category?.name}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                {template.name}
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                {template.shortDescription}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {template.averageRating.toFixed(1)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    ({template.totalRatings} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {template.downloadCount.toLocaleString()} downloads
                  </span>
                </div>
              </div>

              {/* CTA */}
              {template.hasPurchased ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      You own this template
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Use it in your projects from the dashboard
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatPrice(template.price, template.currency)}
                    </div>
                    {template.discountPercent > 0 && (
                      <div className="text-sm text-slate-500 line-through">
                        {formatPrice(
                          template.price / (1 - template.discountPercent / 100),
                          template.currency
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {template.price === 0 ? 'Get Template' : 'Purchase Now'}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Preview Images */}
            <div>
              {template.previewImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {template.previewImages.slice(0, 4).map((image: string, idx: number) => (
                    <img
                      key={idx}
                      src={image}
                      alt={`Preview ${idx + 1}`}
                      className="rounded-lg shadow-lg"
                    />
                  ))}
                </div>
              ) : template.thumbnailUrl ? (
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="rounded-lg shadow-lg w-full"
                />
              ) : (
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg h-96 flex items-center justify-center">
                  <span className="text-8xl">📱</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                About This Template
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                  {template.fullDescription}
                </p>
              </div>
            </section>

            {/* Features */}
            {template.features.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Features
                </h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {template.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Reviews */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Reviews ({template.totalRatings})
                </h2>
                {template.hasPurchased && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    templateId={template.id}
                    onSubmit={handleReviewSubmit}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              <div className="space-y-4">
                {reviewsData?.reviews.map((review: Review) => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.user.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {review.user.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-slate-300 dark:text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified Purchase
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                        {review.title}
                      </h4>
                    )}

                    {review.comment && (
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{review.comment}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {reviewsData?.reviews.length === 0 && (
                  <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No reviews yet. Be the first to review this template!
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Template Information
              </h3>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Version</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">{template.version}</dd>
                </div>

                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Platforms</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">
                    {template.platforms.join(', ')}
                  </dd>
                </div>

                {template.minExpoVersion && (
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Min Expo Version</dt>
                    <dd className="font-medium text-slate-900 dark:text-white">
                      {template.minExpoVersion}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Publisher</dt>
                  <dd className="font-medium text-slate-900 dark:text-white">
                    {template.publisher.name}
                    {template.isOfficial && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">✓ Official</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Links */}
            {(template.demoUrl || template.videoUrl) && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Resources</h3>

                <div className="space-y-2">
                  {template.demoUrl && (
                    <a
                      href={template.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  )}

                  {template.videoUrl && (
                    <a
                      href={template.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Video Preview
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseModal
          template={{
            id: template.id,
            name: template.name,
            price: template.price,
            currency: template.currency,
            tier: template.tier,
          }}
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
}
