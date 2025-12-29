# @mobigen/marketplace

Marketplace infrastructure for Mobigen templates.

## Overview

This package provides the core business logic and utilities for the Mobigen template marketplace, including:

- Template validation and quality scoring
- Pricing calculations and revenue sharing
- Template versioning and changelog generation
- Publishing workflow management

## Features

### Template Validation

Comprehensive validation of template configurations:

```typescript
import { validateTemplate } from '@mobigen/marketplace';

const result = await validateTemplate(config, templatePath);
// Returns: { valid: boolean, errors: [], warnings: [], score: number }
```

### Pricing & Revenue Sharing

Calculate prices and revenue splits:

```typescript
import { calculatePrice, calculateRevenueShare } from '@mobigen/marketplace';

// Calculate final price with license type and discounts
const pricing = calculatePrice(basePrice, 'team', discount);

// Calculate revenue sharing (default: 70% publisher, 30% platform)
const revenue = calculateRevenueShare(saleAmount, 70);
```

### Version Management

Semantic versioning utilities:

```typescript
import { parseVersion, compareVersions, incrementVersion } from '@mobigen/marketplace';

// Parse and compare versions
const comparison = compareVersions('1.2.3', '1.2.0'); // Returns: 1

// Auto-increment based on changes
const newVersion = incrementVersion('1.2.3', 'minor'); // Returns: '1.3.0'
```

### Publishing Workflow

Automated publishing pipeline:

```typescript
import { createPublishingWorkflow, executePublishingWorkflow } from '@mobigen/marketplace';

const workflow = createPublishingWorkflow(templateId);
const result = await executePublishingWorkflow(workflow, config, templatePath);

// Workflow steps:
// 1. Validate configuration
// 2. Validate file structure
// 3. Check compatibility
// 4. Generate preview assets
// 5. Create marketplace listing
// 6. Quality review
// 7. Publish
```

## Database Models

The marketplace uses the following Prisma models (defined in `@mobigen/db`):

### TemplateCategory

Organize templates into categories:

- E-commerce
- Loyalty & Rewards
- News & Content
- Social/Community
- Finance/Tracking
- Entertainment
- Booking/Appointments
- AI Assistants

### TemplateMarketplace

Published templates with:

- Template metadata (name, description, version)
- Pricing tiers (free, premium, enterprise)
- Publisher information
- Statistics (downloads, ratings, reviews)
- Preview assets (thumbnails, screenshots, videos)
- Compatibility requirements

### TemplatePurchase

Track template purchases:

- User and template references
- Payment details (Stripe integration)
- License type (single, team, enterprise)
- License key generation

### TemplateReview

User reviews and ratings:

- 1-5 star ratings
- Review title and comment
- Verified purchase indicator
- Helpful vote tracking

## API Endpoints

The marketplace router (`packages/api/src/routers/marketplace.ts`) provides:

### Public Endpoints

- `listTemplates` - Browse templates with filtering, sorting, pagination
- `getTemplate` - Get template details by ID or slug
- `listCategories` - Get all active categories
- `getTemplateReviews` - Get reviews for a template

### Protected Endpoints

- `getUserPurchases` - Get user's purchased templates
- `purchaseTemplate` - Purchase a template (Stripe integration)
- `submitReview` - Submit a review
- `updateReviewHelpfulness` - Mark review as helpful

### Admin Endpoints

- `publishTemplate` - Publish a template to marketplace

## UI Components

Located in `apps/web/src/components/marketplace/`:

### TemplateCard

Preview card for marketplace listings with:
- Thumbnail image
- Pricing and tier badge
- Rating and download stats
- Category label

### TemplateGrid

Responsive grid layout for template cards with:
- Loading states
- Empty state handling
- Responsive columns (1/2/3)

### TemplateFilters

Search and filter interface with:
- Search bar
- Category filter
- Pricing tier filter
- Sort options (popular, newest, rating, price)
- Quick filter pills

### PurchaseModal

Template purchase flow with:
- License type selection (single, team, enterprise)
- Price calculation with multipliers
- Stripe payment integration
- "What's included" details

### ReviewForm

Review submission form with:
- 5-star rating selector
- Optional title and comment
- Character limits (200/2000)
- Verified purchase indicator

## Pages

### Marketplace Browse (`/marketplace`)

- Search and filter templates
- Grid view with pagination
- Category quick filters
- Sort options

### Template Detail (`/marketplace/[slug]`)

- Full template information
- Preview images/screenshots
- Feature list
- Reviews and ratings
- Purchase CTA
- Publisher information
- Resource links (demo, video)

### My Purchases (`/dashboard/purchases`)

- Grid of purchased templates
- License key display
- Purchase date and license type
- Quick actions (view details, download)
- Purchase summary stats

## Pricing Tiers

### Free Tier

- $0
- Full source code
- Basic customization
- Community support
- Single project license

### Premium Tier

- Base: $49
- Team: $147 (3x multiplier)
- Enterprise: $392 (8x multiplier)
- Advanced customization
- Priority support
- Regular updates

### Enterprise Tier

- Base: $199
- Unlimited projects
- White-label support
- Dedicated support
- Custom modifications

## Revenue Sharing

Default split:
- **70%** to template publisher
- **30%** to Mobigen platform

Configurable per template for future third-party publishers.

## Quality Scoring

Templates are scored 0-100 based on:

- **Required fields** (-20 points per missing field)
- **Warnings** (-5 points each)
- **Documentation quality** (+5 for detailed descriptions)
- **Test coverage** (+5 for 3+ test suites)
- **Customization options** (+5 for 5+ customizable areas)
- **Platform support** (+5 for multi-platform)

Minimum recommended score: **75**

## Stripe Integration

Payment processing uses Stripe:

```typescript
// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: finalPrice,
  currency: template.currency,
  payment_method: paymentMethodId,
  confirm: true,
  metadata: {
    userId,
    templateId,
    licenseType,
  },
});
```

Free templates skip Stripe and create purchase records directly.

## Future Enhancements

- [ ] Third-party publisher onboarding
- [ ] Template bundles and subscriptions
- [ ] A/B testing for pricing
- [ ] Referral program
- [ ] Template preview in Expo Go
- [ ] Automated quality checks (CI/CD)
- [ ] Template marketplace analytics
- [ ] Wishlist and favorites
- [ ] Gift purchases

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Run tests
pnpm test
```

## License

Proprietary - Mobigen, Inc.
