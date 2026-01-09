/**
 * Pet Care Tips and Articles API
 *
 * This module provides pet care tips and articles.
 * Uses local data with real, useful pet care information.
 */

export interface PetCareTip {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: PetCareCategory;
  petType: 'dog' | 'cat' | 'both';
  imageUrl?: string;
  author: string;
  readTimeMinutes: number;
  tags: string[];
  publishedAt: string;
}

export type PetCareCategory =
  | 'nutrition'
  | 'health'
  | 'grooming'
  | 'training'
  | 'behavior'
  | 'safety'
  | 'exercise'
  | 'wellness';

// Real, useful pet care tips
const PET_CARE_TIPS: PetCareTip[] = [
  {
    id: '1',
    title: 'How Much Water Does Your Dog Really Need?',
    summary: 'Learn the right amount of water for your dog based on size, activity level, and weather.',
    content: `Dogs need about 1 ounce of water per pound of body weight daily. A 50-pound dog should drink approximately 50 ounces (about 6 cups) of water per day.

However, this can vary based on:
- **Activity Level**: Active dogs need more water
- **Weather**: Hot weather increases water needs by 50-100%
- **Diet**: Dogs eating dry kibble need more water than those on wet food
- **Health**: Some conditions require more or less water

**Signs of Dehydration:**
- Dry gums
- Loss of skin elasticity
- Lethargy
- Sunken eyes

Always provide fresh, clean water and monitor your dog's intake.`,
    category: 'nutrition',
    petType: 'dog',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    author: 'Dr. Sarah Mitchell, DVM',
    readTimeMinutes: 3,
    tags: ['hydration', 'water', 'health basics'],
    publishedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Essential Vaccinations for Puppies',
    summary: 'A complete guide to the vaccines your puppy needs in their first year.',
    content: `Core vaccines are essential for all puppies:

**6-8 Weeks:**
- Distemper
- Parvovirus

**10-12 Weeks:**
- DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)
- Bordetella (if boarding/daycare)

**14-16 Weeks:**
- DHPP booster
- Rabies (required by law)

**Non-Core Vaccines** (based on lifestyle):
- Lyme disease
- Leptospirosis
- Canine influenza

Keep your puppy away from unvaccinated dogs and public dog areas until fully vaccinated around 16 weeks.`,
    category: 'health',
    petType: 'dog',
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800',
    author: 'Dr. James Chen, DVM',
    readTimeMinutes: 4,
    tags: ['puppies', 'vaccinations', 'preventive care'],
    publishedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    title: 'Why Your Cat Needs Regular Nail Trims',
    summary: 'Untrimmed nails can cause pain and health issues for your cat.',
    content: `Regular nail trimming is crucial for your cat's health:

**Problems from Overgrown Nails:**
- Nails can curve and grow into paw pads
- Difficulty walking
- Snagging on fabric and carpets
- Painful scratching injuries

**How Often to Trim:**
- Indoor cats: Every 2-3 weeks
- Outdoor cats: Monthly (naturally worn down)

**Tips for Easy Trimming:**
1. Start young to get them used to handling
2. Use proper cat nail clippers
3. Only trim the clear tip, avoid the pink "quick"
4. Give treats and praise
5. Do one paw at a time if needed

If you're uncomfortable trimming, ask your vet or groomer to demonstrate.`,
    category: 'grooming',
    petType: 'cat',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    author: 'Dr. Emily Rodriguez, DVM',
    readTimeMinutes: 3,
    tags: ['grooming', 'nails', 'cat care'],
    publishedAt: '2024-01-08T10:00:00Z',
  },
  {
    id: '4',
    title: 'House Training Your Puppy: A Step-by-Step Guide',
    summary: 'Effective methods to potty train your new puppy in just a few weeks.',
    content: `Successful house training requires consistency and patience:

**The Golden Rules:**
1. **Take puppy out frequently**: Every 2 hours, after meals, after play, after naps
2. **Use the same spot**: Dogs prefer consistency
3. **Praise immediately**: Right when they finish, not after coming inside
4. **Watch for signs**: Sniffing, circling, squatting

**Crate Training Tips:**
- Dogs don't like to soil their sleeping area
- Crate should be just big enough to stand and turn
- Never use crate as punishment
- Maximum crate time: Age in months + 1 hour

**Accidents Happen:**
- Clean with enzymatic cleaner (not ammonia)
- Don't punish after the fact
- Supervise more closely

Most puppies are reliably trained by 4-6 months.`,
    category: 'training',
    petType: 'dog',
    imageUrl: 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=800',
    author: 'Mike Thompson, CPDT-KA',
    readTimeMinutes: 5,
    tags: ['training', 'puppies', 'house training'],
    publishedAt: '2024-01-05T10:00:00Z',
  },
  {
    id: '5',
    title: 'Understanding Your Cat\'s Body Language',
    summary: 'Decode what your cat is trying to tell you through their posture and movements.',
    content: `Cats communicate volumes through body language:

**Tail Positions:**
- **Straight up**: Happy, confident
- **Puffed up**: Scared or aggressive
- **Low or tucked**: Anxious or submissive
- **Slowly swishing**: Focused, hunting mode
- **Rapidly thrashing**: Agitated, leave me alone

**Ear Positions:**
- **Forward**: Alert, interested
- **Flat back**: Scared or angry
- **Rotating**: Listening to surroundings

**Eye Signals:**
- **Slow blink**: "I trust you" (blink back!)
- **Dilated pupils**: Excited, playful, or scared
- **Constricted pupils**: Aggressive or content
- **Direct stare**: Challenge (avoid with unfamiliar cats)

**Belly Display:**
- Often means trust, NOT "pet my belly"
- Many cats will bite if you touch their belly

Understanding these signals helps prevent scratches and builds a stronger bond.`,
    category: 'behavior',
    petType: 'cat',
    imageUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800',
    author: 'Dr. Lisa Park, Animal Behaviorist',
    readTimeMinutes: 4,
    tags: ['behavior', 'communication', 'body language'],
    publishedAt: '2024-01-03T10:00:00Z',
  },
  {
    id: '6',
    title: 'Foods That Are Toxic to Dogs and Cats',
    summary: 'Know which common household foods can be dangerous or deadly for your pets.',
    content: `Keep these foods away from your pets:

**Toxic to Both Dogs and Cats:**
- **Chocolate**: Contains theobromine, can be fatal
- **Grapes/Raisins**: Cause kidney failure
- **Onions/Garlic**: Damage red blood cells
- **Xylitol** (artificial sweetener): Causes liver failure
- **Alcohol**: Even small amounts are dangerous
- **Caffeine**: Can cause heart problems
- **Macadamia nuts**: Weakness, vomiting, tremors

**Toxic to Cats Specifically:**
- Lilies (all parts, even pollen)
- Raw eggs
- Raw fish (thiamine deficiency)

**What to Do If Ingested:**
1. Call Pet Poison Control: (888) 426-4435
2. Note what was eaten and how much
3. Don't induce vomiting unless instructed
4. Bring packaging to the vet

Keep the poison control number saved in your phone!`,
    category: 'safety',
    petType: 'both',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800',
    author: 'Dr. Sarah Mitchell, DVM',
    readTimeMinutes: 4,
    tags: ['safety', 'toxic foods', 'emergency'],
    publishedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '7',
    title: 'How Much Exercise Does Your Dog Need?',
    summary: 'Exercise requirements vary by breed, age, and health - here\'s how to get it right.',
    content: `Exercise keeps dogs healthy, happy, and well-behaved:

**By Breed Type:**
- **High Energy** (Border Collie, Husky): 2+ hours daily
- **Sporting** (Labrador, Golden): 1-2 hours daily
- **Medium Energy** (Beagle, Bulldog): 30-60 minutes daily
- **Low Energy** (Basset, Shih Tzu): 30 minutes daily

**By Age:**
- **Puppies**: 5 minutes per month of age, twice daily
- **Adults**: Full exercise based on breed
- **Seniors**: Shorter, gentler activities

**Signs of Under-Exercise:**
- Destructive behavior
- Excessive barking
- Hyperactivity indoors
- Weight gain

**Signs of Over-Exercise:**
- Limping or stiffness
- Excessive panting
- Refusing to walk
- Sleeping more than usual

Mix activities: walks, fetch, swimming, puzzle toys, training sessions.`,
    category: 'exercise',
    petType: 'dog',
    imageUrl: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800',
    author: 'Jessica Brown, Certified Dog Trainer',
    readTimeMinutes: 4,
    tags: ['exercise', 'health', 'activity'],
    publishedAt: '2023-12-28T10:00:00Z',
  },
  {
    id: '8',
    title: 'Setting Up the Perfect Litter Box',
    summary: 'The right litter box setup prevents accidents and keeps your cat happy.',
    content: `Litter box problems are the #1 reason cats are surrendered to shelters. Get it right:

**The Golden Rules:**
- **Number of boxes**: One per cat, plus one extra
- **Size**: 1.5x your cat's length (most commercial boxes are too small)
- **Location**: Quiet, accessible, not near food

**Litter Preferences:**
- Most cats prefer unscented, clumping litter
- Depth: 2-3 inches
- Avoid sudden changes (mix new litter gradually)

**Cleaning Schedule:**
- Scoop: Daily (minimum)
- Full clean: Weekly
- Replace litter: Monthly
- Replace box: Yearly (plastic absorbs odors)

**Covered vs Uncovered:**
- Many cats feel trapped in covered boxes
- Covered boxes trap odors inside
- Try both and let your cat choose

**If Your Cat Stops Using the Box:**
1. Rule out medical issues first (UTI is common)
2. Check cleanliness
3. Consider location and accessibility
4. Look for stressors (new pet, moving, etc.)`,
    category: 'wellness',
    petType: 'cat',
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800',
    author: 'Dr. Emily Rodriguez, DVM',
    readTimeMinutes: 4,
    tags: ['litter box', 'cat care', 'behavior'],
    publishedAt: '2023-12-25T10:00:00Z',
  },
  {
    id: '9',
    title: 'Dental Care for Dogs: Beyond Bad Breath',
    summary: 'Poor dental health can lead to serious diseases - here\'s how to protect your dog.',
    content: `80% of dogs show signs of dental disease by age 3:

**Why It Matters:**
- Bacteria from gum disease enters bloodstream
- Can cause heart, liver, and kidney problems
- Painful teeth affect eating and behavior
- Extractions are expensive

**Prevention:**
1. **Brush daily** (or at least 3x weekly)
   - Use dog-specific toothpaste (human toothpaste is toxic)
   - Start slow, reward cooperation
2. **Dental chews**: Look for VOHC seal
3. **Professional cleaning**: Yearly recommended
4. **Water additives**: Helpful but not sufficient alone

**Warning Signs:**
- Bad breath (not normal!)
- Red or bleeding gums
- Loose teeth
- Difficulty eating
- Pawing at mouth

**Getting Started:**
- Let dog taste toothpaste first
- Lift lip and touch teeth
- Use finger brush before regular brush
- Keep sessions short and positive`,
    category: 'health',
    petType: 'dog',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    author: 'Dr. James Chen, DVM',
    readTimeMinutes: 4,
    tags: ['dental', 'health', 'preventive care'],
    publishedAt: '2023-12-20T10:00:00Z',
  },
  {
    id: '10',
    title: 'Introducing a New Cat to Your Home',
    summary: 'A slow introduction prevents stress and conflict between cats.',
    content: `Rushing introductions is the biggest mistake new cat owners make:

**Week 1: Separate Spaces**
- New cat in separate room with own litter box, food, water
- Swap bedding between cats to share scents
- Feed on opposite sides of closed door

**Week 2: Visual Introduction**
- Use baby gate or cracked door
- Continue feeding near the barrier
- Supervise all interactions
- End on positive note (before any hissing)

**Week 3+: Supervised Meetings**
- Short, supervised sessions
- Reward calm behavior with treats
- Separate at first sign of tension
- Gradually increase time together

**Good Signs:**
- Eating near each other
- Relaxed body language
- Curiosity without aggression
- Slow blinking at each other

**Bad Signs (go back a step):**
- Sustained staring
- Growling/hissing
- Puffed fur
- Stalking or chasing

**Tips:**
- Vertical space reduces conflict
- Multiple resources (food bowls, litter boxes)
- Feliway diffusers can help
- Some cats need 3-6 months to fully adjust`,
    category: 'behavior',
    petType: 'cat',
    imageUrl: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
    author: 'Dr. Lisa Park, Animal Behaviorist',
    readTimeMinutes: 5,
    tags: ['new pet', 'introduction', 'multi-cat'],
    publishedAt: '2023-12-15T10:00:00Z',
  },
];

/**
 * Get all pet care tips
 */
export function getAllTips(): PetCareTip[] {
  return [...PET_CARE_TIPS];
}

/**
 * Get tips by pet type
 */
export function getTipsByPetType(petType: 'dog' | 'cat'): PetCareTip[] {
  return PET_CARE_TIPS.filter(
    tip => tip.petType === petType || tip.petType === 'both'
  );
}

/**
 * Get tips by category
 */
export function getTipsByCategory(category: PetCareCategory): PetCareTip[] {
  return PET_CARE_TIPS.filter(tip => tip.category === category);
}

/**
 * Get a single tip by ID
 */
export function getTipById(id: string): PetCareTip | null {
  return PET_CARE_TIPS.find(tip => tip.id === id) ?? null;
}

/**
 * Search tips by keyword
 */
export function searchTips(query: string): PetCareTip[] {
  const lowerQuery = query.toLowerCase();
  return PET_CARE_TIPS.filter(
    tip =>
      tip.title.toLowerCase().includes(lowerQuery) ||
      tip.summary.toLowerCase().includes(lowerQuery) ||
      tip.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get featured/latest tips
 */
export function getFeaturedTips(limit: number = 5): PetCareTip[] {
  return [...PET_CARE_TIPS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

/**
 * Get all available categories
 */
export function getCategories(): PetCareCategory[] {
  return [
    'nutrition',
    'health',
    'grooming',
    'training',
    'behavior',
    'safety',
    'exercise',
    'wellness',
  ];
}

/**
 * Get category display names
 */
export function getCategoryDisplayName(category: PetCareCategory): string {
  const displayNames: Record<PetCareCategory, string> = {
    nutrition: 'Nutrition & Diet',
    health: 'Health & Wellness',
    grooming: 'Grooming',
    training: 'Training',
    behavior: 'Behavior',
    safety: 'Safety',
    exercise: 'Exercise & Activity',
    wellness: 'General Wellness',
  };
  return displayNames[category];
}
