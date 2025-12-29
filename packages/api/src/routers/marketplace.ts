import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';

// Initialize Stripe (will use env var)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const listTemplatesSchema = z.object({
  categoryId: z.string().optional(),
  tier: z.enum(['free', 'premium', 'enterprise']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['popular', 'newest', 'rating', 'price']).default('popular'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const purchaseTemplateSchema = z.object({
  templateId: z.string(),
  paymentMethodId: z.string().optional(), // Stripe payment method ID
  licenseType: z.enum(['single', 'team', 'enterprise']).default('single'),
});

const submitReviewSchema = z.object({
  templateId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

const updateReviewHelpfulnessSchema = z.object({
  reviewId: z.string(),
  isHelpful: z.boolean(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const marketplaceRouter = router({
  /**
   * List all published templates with filtering and pagination
   */
  listTemplates: publicProcedure
    .input(listTemplatesSchema)
    .query(async ({ ctx, input }) => {
      const { categoryId, tier, search, sortBy, page, limit } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        status: 'published',
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (tier) {
        where.tier = tier;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { keywords: { has: search.toLowerCase() } },
          { tags: { has: search.toLowerCase() } },
        ];
      }

      // Build order by
      let orderBy: any = {};
      switch (sortBy) {
        case 'popular':
          orderBy = { downloadCount: 'desc' };
          break;
        case 'newest':
          orderBy = { publishedAt: 'desc' };
          break;
        case 'rating':
          orderBy = { averageRating: 'desc' };
          break;
        case 'price':
          orderBy = { price: 'asc' };
          break;
      }

      const [templates, total] = await Promise.all([
        ctx.prisma.templateMarketplace.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: true,
            publisher: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                purchases: true,
                reviews: true,
              },
            },
          },
        }),
        ctx.prisma.templateMarketplace.count({ where }),
      ]);

      return {
        templates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get template details by ID or slug
   */
  getTemplate: publicProcedure
    .input(z.object({
      id: z.string().optional(),
      slug: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!input.id && !input.slug) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either id or slug must be provided',
        });
      }

      const template = await ctx.prisma.templateMarketplace.findFirst({
        where: input.id ? { id: input.id } : { slug: input.slug },
        include: {
          category: true,
          publisher: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              purchases: true,
              reviews: true,
            },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Check if current user has purchased this template
      let hasPurchased = false;
      if (ctx.userId) {
        const purchase = await ctx.prisma.templatePurchase.findUnique({
          where: {
            userId_templateId: {
              userId: ctx.userId,
              templateId: template.id,
            },
          },
        });
        hasPurchased = purchase?.paymentStatus === 'succeeded';
      }

      return {
        ...template,
        hasPurchased,
      };
    }),

  /**
   * List all categories
   */
  listCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.templateCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            templates: {
              where: { status: 'published' },
            },
          },
        },
      },
    });
  }),

  /**
   * Get user's purchased templates
   */
  getUserPurchases: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.templatePurchase.findMany({
      where: {
        userId: ctx.userId,
        paymentStatus: 'succeeded',
      },
      include: {
        template: {
          include: {
            category: true,
            publisher: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  /**
   * Purchase a template (create Stripe payment intent or mark as free)
   */
  purchaseTemplate: protectedProcedure
    .input(purchaseTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { templateId, paymentMethodId, licenseType } = input;

      // Get template
      const template = await ctx.prisma.templateMarketplace.findUnique({
        where: { id: templateId },
      });

      if (!template || template.status !== 'published') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found or not available',
        });
      }

      // Check if already purchased
      const existingPurchase = await ctx.prisma.templatePurchase.findUnique({
        where: {
          userId_templateId: {
            userId: ctx.userId,
            templateId,
          },
        },
      });

      if (existingPurchase?.paymentStatus === 'succeeded') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already purchased this template',
        });
      }

      // Calculate price with discount
      const discountAmount = Math.floor((template.price * template.discountPercent) / 100);
      const finalPrice = template.price - discountAmount;

      // Generate license key
      const licenseKey = generateLicenseKey();

      // If free template, just create purchase record
      if (finalPrice === 0) {
        const purchase = await ctx.prisma.templatePurchase.create({
          data: {
            userId: ctx.userId,
            templateId,
            price: template.price,
            currency: template.currency,
            discountApplied: discountAmount,
            finalPrice,
            paymentStatus: 'succeeded',
            licenseKey,
            licenseType,
            metadata: {},
          },
        });

        // Update template stats
        await ctx.prisma.templateMarketplace.update({
          where: { id: templateId },
          data: {
            downloadCount: { increment: 1 },
            purchaseCount: { increment: 1 },
          },
        });

        return purchase;
      }

      // For paid templates, create Stripe payment
      if (!stripe) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Payment processing is not configured',
        });
      }

      if (!paymentMethodId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment method is required for paid templates',
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: finalPrice,
        currency: template.currency,
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          userId: ctx.userId,
          templateId,
          licenseType,
        },
      });

      // Create purchase record
      const purchase = await ctx.prisma.templatePurchase.create({
        data: {
          userId: ctx.userId,
          templateId,
          price: template.price,
          currency: template.currency,
          discountApplied: discountAmount,
          finalPrice,
          stripePaymentId: paymentIntent.id,
          paymentStatus: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
          paymentMethod: paymentMethodId,
          licenseKey,
          licenseType,
          metadata: {},
        },
      });

      // Update template stats if payment succeeded
      if (paymentIntent.status === 'succeeded') {
        await ctx.prisma.templateMarketplace.update({
          where: { id: templateId },
          data: {
            downloadCount: { increment: 1 },
            purchaseCount: { increment: 1 },
          },
        });
      }

      return purchase;
    }),

  /**
   * Get reviews for a template
   */
  getTemplateReviews: publicProcedure
    .input(z.object({
      templateId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const { templateId, page, limit } = input;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        ctx.prisma.templateReview.findMany({
          where: {
            templateId,
            isPublished: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: [
            { helpfulCount: 'desc' },
            { createdAt: 'desc' },
          ],
          skip,
          take: limit,
        }),
        ctx.prisma.templateReview.count({
          where: {
            templateId,
            isPublished: true,
          },
        }),
      ]);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Submit a review for a template
   */
  submitReview: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const { templateId, rating, title, comment } = input;

      // Check if user has purchased the template
      const purchase = await ctx.prisma.templatePurchase.findUnique({
        where: {
          userId_templateId: {
            userId: ctx.userId,
            templateId,
          },
        },
      });

      const isVerifiedPurchase = purchase?.paymentStatus === 'succeeded';

      // Create or update review
      const review = await ctx.prisma.templateReview.upsert({
        where: {
          userId_templateId: {
            userId: ctx.userId,
            templateId,
          },
        },
        create: {
          userId: ctx.userId,
          templateId,
          rating,
          title,
          comment,
          isVerifiedPurchase,
        },
        update: {
          rating,
          title,
          comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // Update template average rating
      await updateTemplateRating(ctx.prisma, templateId);

      return review;
    }),

  /**
   * Mark a review as helpful or not helpful
   */
  updateReviewHelpfulness: protectedProcedure
    .input(updateReviewHelpfulnessSchema)
    .mutation(async ({ ctx, input }) => {
      const { reviewId, isHelpful } = input;

      const review = await ctx.prisma.templateReview.update({
        where: { id: reviewId },
        data: isHelpful
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      });

      return review;
    }),

  /**
   * Admin: Publish a template
   */
  publishTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Add admin role check
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (user?.tier !== 'enterprise') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only administrators can publish templates',
        });
      }

      return ctx.prisma.templateMarketplace.update({
        where: { id: input.templateId },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      });
    }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique license key
 */
function generateLicenseKey(): string {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = Math.random().toString(36).substring(2, 8).toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

/**
 * Update template's average rating based on all reviews
 */
async function updateTemplateRating(db: any, templateId: string) {
  const result = await db.templateReview.aggregate({
    where: {
      templateId,
      isPublished: true,
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });

  await db.templateMarketplace.update({
    where: { id: templateId },
    data: {
      averageRating: result._avg.rating || 0,
      totalRatings: result._count.rating || 0,
    },
  });
}
