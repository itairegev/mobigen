import { Category, MenuItem } from '@/types';
import {
  getMealCategories,
  getMealsByCategory,
  getMealById,
  searchMeals as searchMealsApi,
  getRandomMeals,
} from './meals-api';

// ============================================================================
// Mock Categories (Fallback when API fails)
// ============================================================================

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Appetizers', sortOrder: 1, description: 'Start your meal right' },
  { id: '2', name: 'Main Courses', sortOrder: 2, description: 'Our signature dishes' },
  { id: '3', name: 'Pizza & Pasta', sortOrder: 3, description: 'Italian classics' },
  { id: '4', name: 'Desserts', sortOrder: 4, description: 'Sweet endings' },
  { id: '5', name: 'Beverages', sortOrder: 5, description: 'Drinks & refreshments' },
];

// ============================================================================
// Mock Menu Items (20 items across 5 categories)
// ============================================================================

export const MOCK_MENU_ITEMS: MenuItem[] = [
  // Appetizers (4 items)
  {
    id: '1',
    name: 'Crispy Calamari',
    description: 'Lightly fried calamari served with marinara sauce and lemon',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
    categoryId: '1',
    dietaryTags: [],
    available: true,
    prepTime: 15,
    calories: 320,
    featured: false,
  },
  {
    id: '2',
    name: 'Bruschetta',
    description: 'Toasted bread topped with fresh tomatoes, basil, and garlic',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
    categoryId: '1',
    dietaryTags: ['vegetarian', 'vegan'],
    available: true,
    prepTime: 10,
    calories: 180,
    featured: true,
  },
  {
    id: '3',
    name: 'Mozzarella Sticks',
    description: 'Golden fried mozzarella with marinara dipping sauce',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400',
    categoryId: '1',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 12,
    calories: 280,
    featured: false,
  },
  {
    id: '4',
    name: 'Buffalo Wings',
    description: 'Spicy chicken wings with celery and blue cheese dressing',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
    categoryId: '1',
    dietaryTags: ['spicy', 'gluten-free'],
    available: true,
    prepTime: 20,
    calories: 450,
    featured: false,
  },

  // Main Courses (5 items)
  {
    id: '5',
    name: 'Grilled Salmon',
    description: 'Fresh Atlantic salmon with lemon butter sauce, served with vegetables',
    price: 22.99,
    image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=400',
    categoryId: '2',
    dietaryTags: ['gluten-free', 'dairy-free'],
    available: true,
    prepTime: 25,
    calories: 520,
    featured: true,
    modifierGroups: [
      {
        id: 'mg1',
        name: 'Side Options',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { id: 'm1', name: 'Mashed Potatoes', price: 0 },
          { id: 'm2', name: 'Rice Pilaf', price: 0 },
          { id: 'm3', name: 'Grilled Vegetables', price: 0 },
        ],
      },
    ],
  },
  {
    id: '6',
    name: 'Ribeye Steak',
    description: '12oz premium ribeye cooked to perfection',
    price: 32.99,
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400',
    categoryId: '2',
    dietaryTags: ['gluten-free'],
    available: true,
    prepTime: 30,
    calories: 680,
    featured: true,
    modifierGroups: [
      {
        id: 'mg2',
        name: 'Cooking Temperature',
        required: true,
        minSelections: 1,
        maxSelections: 1,
        modifiers: [
          { id: 'm4', name: 'Rare', price: 0 },
          { id: 'm5', name: 'Medium Rare', price: 0 },
          { id: 'm6', name: 'Medium', price: 0 },
          { id: 'm7', name: 'Medium Well', price: 0 },
          { id: 'm8', name: 'Well Done', price: 0 },
        ],
      },
      {
        id: 'mg3',
        name: 'Add-ons',
        required: false,
        minSelections: 0,
        maxSelections: 3,
        modifiers: [
          { id: 'm9', name: 'Grilled Shrimp', price: 6.99 },
          { id: 'm10', name: 'Sautéed Mushrooms', price: 3.99 },
          { id: 'm11', name: 'Blue Cheese Crust', price: 2.99 },
        ],
      },
    ],
  },
  {
    id: '7',
    name: 'Chicken Parmesan',
    description: 'Breaded chicken breast with marinara and melted mozzarella',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400',
    categoryId: '2',
    dietaryTags: [],
    available: true,
    prepTime: 25,
    calories: 620,
    featured: false,
  },
  {
    id: '8',
    name: 'Veggie Stir Fry',
    description: 'Seasonal vegetables in ginger soy sauce over rice',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    categoryId: '2',
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    available: true,
    prepTime: 18,
    calories: 380,
    featured: false,
  },
  {
    id: '9',
    name: 'BBQ Ribs',
    description: 'Slow-cooked pork ribs with our signature BBQ sauce',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    categoryId: '2',
    dietaryTags: ['gluten-free'],
    available: true,
    prepTime: 35,
    calories: 720,
    featured: true,
  },

  // Pizza & Pasta (5 items)
  {
    id: '10',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, basil, and tomato sauce',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    categoryId: '3',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 20,
    calories: 580,
    featured: true,
  },
  {
    id: '11',
    name: 'Pepperoni Pizza',
    description: 'Classic pepperoni with mozzarella cheese',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    categoryId: '3',
    dietaryTags: [],
    available: true,
    prepTime: 20,
    calories: 650,
    featured: false,
  },
  {
    id: '12',
    name: 'Fettuccine Alfredo',
    description: 'Creamy parmesan sauce over fresh fettuccine',
    price: 17.99,
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400',
    categoryId: '3',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 22,
    calories: 720,
    featured: false,
    modifierGroups: [
      {
        id: 'mg4',
        name: 'Add Protein',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        modifiers: [
          { id: 'm12', name: 'Grilled Chicken', price: 5.99 },
          { id: 'm13', name: 'Shrimp', price: 7.99 },
        ],
      },
    ],
  },
  {
    id: '13',
    name: 'Spaghetti Carbonara',
    description: 'Traditional Roman pasta with pancetta and egg',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    categoryId: '3',
    dietaryTags: [],
    available: true,
    prepTime: 20,
    calories: 680,
    featured: false,
  },
  {
    id: '14',
    name: 'Vegetarian Pizza',
    description: 'Bell peppers, mushrooms, onions, olives, and tomatoes',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400',
    categoryId: '3',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 20,
    calories: 520,
    featured: false,
  },

  // Desserts (3 items)
  {
    id: '15',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with espresso-soaked ladyfingers',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    categoryId: '4',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 5,
    calories: 380,
    featured: true,
  },
  {
    id: '16',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    categoryId: '4',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 15,
    calories: 520,
    featured: true,
  },
  {
    id: '17',
    name: 'Cheesecake',
    description: 'New York style cheesecake with berry compote',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?w=400',
    categoryId: '4',
    dietaryTags: ['vegetarian'],
    available: true,
    prepTime: 5,
    calories: 420,
    featured: false,
  },

  // Beverages (3 items)
  {
    id: '18',
    name: 'Fresh Lemonade',
    description: 'House-made lemonade with fresh lemons',
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=400',
    categoryId: '5',
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    available: true,
    prepTime: 3,
    calories: 120,
    featured: false,
  },
  {
    id: '19',
    name: 'Iced Tea',
    description: 'Freshly brewed iced tea with lemon',
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    categoryId: '5',
    dietaryTags: ['vegetarian', 'vegan', 'gluten-free'],
    available: true,
    prepTime: 2,
    calories: 80,
    featured: false,
  },
  {
    id: '20',
    name: 'Craft Soda',
    description: 'Locally made artisan sodas - rotating flavors',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400',
    categoryId: '5',
    dietaryTags: ['vegetarian', 'vegan'],
    available: true,
    prepTime: 2,
    calories: 150,
    featured: false,
  },
];

// ============================================================================
// Service Functions (Real API with mock fallback)
// ============================================================================

/**
 * Get all food categories from TheMealDB
 * Falls back to mock data on error
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await getMealCategories();
    if (categories.length > 0) {
      return categories;
    }
  } catch (error) {
    console.warn('Failed to fetch categories from API, using mock data:', error);
  }
  return [...MOCK_CATEGORIES];
}

/**
 * Get menu items, optionally filtered by category
 * Uses TheMealDB for real meal data with fallback to mock
 */
export async function getMenuItems(categoryId?: string): Promise<MenuItem[]> {
  try {
    if (categoryId) {
      // Find the category name from ID
      const categories = await getCategories();
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        const meals = await getMealsByCategory(category.name);
        if (meals.length > 0) {
          return meals;
        }
      }
    } else {
      // Get featured/random meals when no category specified
      const meals = await getRandomMeals(10);
      if (meals.length > 0) {
        return meals;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch menu items from API, using mock data:', error);
  }

  // Fallback to mock data
  let items = [...MOCK_MENU_ITEMS];
  if (categoryId) {
    items = items.filter((item) => item.categoryId === categoryId);
  }
  return items;
}

/**
 * Get featured menu items
 * Uses random meals from TheMealDB
 */
export async function getFeaturedItems(): Promise<MenuItem[]> {
  try {
    const meals = await getRandomMeals(6);
    if (meals.length > 0) {
      // Mark all as featured for display
      return meals.map(m => ({ ...m, featured: true }));
    }
  } catch (error) {
    console.warn('Failed to fetch featured items from API, using mock data:', error);
  }
  return MOCK_MENU_ITEMS.filter((item) => item.featured);
}

/**
 * Get a single menu item by ID
 */
export async function getMenuItem(id: string): Promise<MenuItem | null> {
  try {
    const meal = await getMealById(id);
    if (meal) {
      return meal;
    }
  } catch (error) {
    console.warn('Failed to fetch menu item from API, using mock data:', error);
  }
  return MOCK_MENU_ITEMS.find((item) => item.id === id) || null;
}

/**
 * Search menu items by query
 */
export async function searchMenuItems(query: string): Promise<MenuItem[]> {
  if (!query.trim()) return [];

  try {
    const results = await searchMealsApi(query);
    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    console.warn('Failed to search meals from API, using mock data:', error);
  }

  // Fallback to mock search
  const lowerQuery = query.toLowerCase();
  return MOCK_MENU_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
  );
}
