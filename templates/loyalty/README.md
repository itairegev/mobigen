# Loyalty Template

Loyalty program React Native template for Mobigen.

## Overview

The loyalty template provides a complete loyalty program experience with points tracking, rewards catalog, tier system, and redemption flows.

## Features

- Points balance display
- Earn points tracking
- Rewards catalog
- Tier system (Bronze, Silver, Gold, Platinum)
- Points redemption
- Transaction history
- QR code scanning
- Push notifications
- Profile management

## Structure

```
loyalty/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Dashboard
│   │   ├── rewards.tsx      # Rewards catalog
│   │   ├── history.tsx      # Transaction history
│   │   └── profile.tsx      # User profile
│   ├── reward/
│   │   └── [id].tsx         # Reward detail
│   ├── redeem/
│   │   └── [id].tsx         # Redemption flow
│   ├── scan/
│   │   └── index.tsx        # QR scanner
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── points/
│   │   ├── PointsBalance.tsx
│   │   ├── PointsCard.tsx
│   │   └── PointsHistory.tsx
│   ├── rewards/
│   │   ├── RewardCard.tsx
│   │   ├── RewardGrid.tsx
│   │   └── RewardDetail.tsx
│   ├── tiers/
│   │   ├── TierBadge.tsx
│   │   ├── TierProgress.tsx
│   │   └── TierBenefits.tsx
│   └── ui/
│       └── ...
├── hooks/
│   ├── usePoints.ts
│   ├── useRewards.ts
│   ├── useTier.ts
│   └── useRedemption.ts
├── services/
│   ├── api.ts
│   ├── points.ts
│   ├── rewards.ts
│   └── tiers.ts
├── types/
│   ├── points.ts
│   ├── reward.ts
│   └── tier.ts
└── ...
```

## Screens

### Dashboard

- Points balance card
- Tier status
- Recent transactions
- Featured rewards
- Quick actions

### Rewards Catalog

- Reward categories
- Filterable list
- Points required
- Availability status

### Transaction History

- Points earned
- Points redeemed
- Transaction details
- Date filtering

### Profile

- Member info
- Tier benefits
- Settings
- Support

## Data Types

### Points Balance

```typescript
interface PointsBalance {
  available: number;
  pending: number;
  lifetime: number;
  expiring: {
    amount: number;
    date: Date;
  };
}
```

### Reward

```typescript
interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  category: RewardCategory;
  availability: 'available' | 'limited' | 'out_of_stock';
  expiresAt?: Date;
}
```

### Tier

```typescript
interface Tier {
  id: string;
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  minPoints: number;
  benefits: TierBenefit[];
  multiplier: number;
}
```

### Transaction

```typescript
interface Transaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  description: string;
  date: Date;
  reference?: string;
}
```

## Hooks

### usePoints

```typescript
const { balance, transactions, loading, refresh } = usePoints();

// Get available points
console.log(balance.available);

// Get transaction history
transactions.forEach(t => console.log(t.points));
```

### useTier

```typescript
const { currentTier, nextTier, progress, benefits } = useTier();

// Check tier status
console.log(`Current: ${currentTier.name}`);
console.log(`Progress to next: ${progress}%`);
```

### useRedemption

```typescript
const { redeem, loading, error } = useRedemption();

// Redeem a reward
await redeem(rewardId, { quantity: 1 });
```

## Components

### PointsCard

```tsx
<PointsCard
  balance={15000}
  tier="gold"
  expiringPoints={{ amount: 500, days: 30 }}
/>
```

### TierProgress

```tsx
<TierProgress
  current="silver"
  next="gold"
  progress={75}
  pointsNeeded={2500}
/>
```

### RewardCard

```tsx
<RewardCard
  reward={reward}
  canRedeem={balance >= reward.pointsCost}
  onPress={() => navigate(`/reward/${reward.id}`)}
/>
```

## Tier System

### Default Tiers

| Tier | Min Points | Multiplier | Benefits |
|------|------------|------------|----------|
| Bronze | 0 | 1x | Basic rewards |
| Silver | 5,000 | 1.25x | Early access |
| Gold | 15,000 | 1.5x | Priority support |
| Platinum | 50,000 | 2x | Exclusive rewards |

### Customization

Modify tiers in `services/tiers.ts`:

```typescript
export const TIERS: Tier[] = [
  {
    id: 'bronze',
    name: 'bronze',
    minPoints: 0,
    multiplier: 1,
    benefits: ['Basic rewards access'],
  },
  // ...
];
```

## QR Code Integration

The template includes QR code scanning for earning points:

```typescript
// app/scan/index.tsx
const handleScan = async (data: string) => {
  const result = await earnPoints(data);
  showToast(`Earned ${result.points} points!`);
};
```

## Use Cases

- Retail loyalty programs
- Restaurant rewards
- Hotel points
- Airline miles
- Subscription perks
- Gaming rewards

## Related Templates

- [base](../base/) - Minimal starter
- [ecommerce](../ecommerce/) - Combine with shopping
