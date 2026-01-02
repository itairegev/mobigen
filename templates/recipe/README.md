# Recipe & Cookbook App Template

A beautiful, full-featured recipe and cookbook application built with React Native, Expo, and NativeWind.

## Features

### Core Functionality
- 📚 **Browse Recipes**: Explore 20+ delicious recipes across 7 categories
- ⭐ **Favorites**: Save your favorite recipes for quick access
- 🛒 **Shopping List**: Add recipe ingredients to your shopping list
- 📅 **Meal Planning**: Plan your weekly meals with an intuitive calendar
- 👤 **User Profile**: Track stats and manage preferences

### Recipe Details
- High-quality recipe photos
- Step-by-step cooking instructions
- Complete ingredient lists with measurements
- Adjustable serving sizes (automatically scales ingredients)
- Cooking time estimates
- Difficulty levels
- Nutritional information
- Recipe ratings and reviews
- Dietary tags (vegetarian, vegan, gluten-free, etc.)

### Categories
1. 🌅 **Breakfast** - Start your day right
2. 🥗 **Lunch** - Midday meals
3. 🍽️ **Dinner** - Evening delights
4. 🍰 **Dessert** - Sweet treats
5. 🍤 **Appetizers** - Start the meal
6. 🥬 **Salads** - Fresh and healthy
7. 🍲 **Soups** - Warm comfort

## Tech Stack

- **Framework**: React Native + Expo SDK 52
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with persistence
- **Storage**: AsyncStorage
- **Icons**: Ionicons (@expo/vector-icons)
- **Type Safety**: TypeScript

## Project Structure

```
recipe/
├── src/
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── index.tsx      # Home screen
│   │   │   ├── categories.tsx # Browse by category
│   │   │   ├── shopping.tsx   # Shopping list
│   │   │   ├── meal-plan.tsx  # Weekly meal planner
│   │   │   └── profile.tsx    # User profile
│   │   ├── recipes/[id].tsx   # Recipe detail
│   │   └── favorites.tsx      # Favorite recipes
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom React hooks & Zustand stores
│   ├── services/              # Data services & mock data
│   ├── theme/                 # Colors and theming
│   ├── types/                 # TypeScript interfaces
│   └── utils/                 # Helper functions
├── .maestro/                  # E2E test flows
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Mock Data

The app includes 20 realistic recipes with complete details:

- **Breakfast**: French Toast, Avocado Toast, Blueberry Pancakes
- **Lunch**: Caesar Salad, Caprese Sandwich, Thai Lettuce Wraps, Buddha Bowl
- **Dinner**: Spaghetti Carbonara, Honey Garlic Salmon, Chicken Tikka Masala, Beef Tacos, Vegetable Stir-Fry
- **Desserts**: Chocolate Chip Cookies, Cheesecake, Apple Pie
- **Appetizers**: Bruschetta, Spinach Artichoke Dip
- **Salads**: Greek Salad, Caprese Salad
- **Soups**: Tomato Basil Soup

Each recipe includes:
- Full ingredient list with measurements
- Step-by-step instructions
- Nutritional information
- Cooking times and difficulty level
- High-quality images

## Key Components

### RecipeCard
Displays recipe preview with image, title, time, servings, and rating.

### IngredientList
Shows ingredients with checkboxes and automatic serving size adjustment.

### StepByStep
Interactive cooking instructions with step completion tracking.

### ShoppingItem
Shopping list item with check/uncheck and delete functionality.

### MealPlanDay
Daily meal planner with breakfast, lunch, dinner, and snack slots.

### NutritionInfo
Displays calorie and macronutrient information per serving.

## State Management

### Zustand Stores

#### `useShoppingList`
- Add/remove items
- Toggle item completion
- Add all ingredients from a recipe
- Clear checked items

#### `useMealPlan`
- Manage weekly meal plan
- Add/remove planned meals
- Clear day or entire week

#### `useFavorites`
- Save/remove favorite recipes
- Check if recipe is favorited
- Toggle favorite status

## Testing

E2E tests are written using Maestro:

```bash
# Run all tests
maestro test .maestro/

# Run specific test
maestro test .maestro/browse-recipes.yaml
```

Test coverage includes:
- ✅ Browse recipes by category
- ✅ Add recipes to favorites
- ✅ Add ingredients to shopping list
- ✅ Check off shopping items
- ✅ View recipe details

## Color Theme

Food-inspired warm and inviting color palette:

- **Primary**: Warm Orange (#FF6B35) - Cooking fire
- **Secondary**: Fresh Teal (#4ECDC4) - Herbs/freshness
- **Accent**: Sunny Yellow (#FFE66D) - Butter/eggs
- **Success**: Fresh Green (#66BB6A)

## Customization

This template is designed to be easily customizable:

1. **Branding**: Update colors in `src/theme/colors.ts`
2. **Recipes**: Modify `src/services/recipes.ts` to add your own recipes
3. **Categories**: Adjust categories in the same file
4. **Features**: Add new components and screens as needed

## License

Part of the Mobigen template collection.
