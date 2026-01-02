## Template: recipe

### Screens (9)
- **TabsLayout** (src/app/(tabs)/_layout.tsx)
  - JSX: Tabs, Tabs.Screen, Ionicons
- **CategoriesScreen** (src/app/(tabs)/categories.tsx)
  - Hooks: useRouter, useLocalSearchParams, useState, useEffect
  - JSX: SafeAreaView, View, Text, ScrollView, CategoryChip...
- **HomeScreen** (src/app/(tabs)/index.tsx)
  - Hooks: useRouter, useState, useEffect
  - JSX: View, ActivityIndicator, SafeAreaView, ScrollView, Text...
- **MealPlanScreen** (src/app/(tabs)/meal-plan.tsx)
  - Hooks: useRouter, useMealPlan
  - JSX: SafeAreaView, View, Text, TouchableOpacity, Ionicons...
- **ProfileScreen** (src/app/(tabs)/profile.tsx)
  - Hooks: useRouter, useFavorites, useShoppingList, useMealPlan
  - JSX: SafeAreaView, ScrollView, View, Ionicons, Text...
- **ShoppingScreen** (src/app/(tabs)/shopping.tsx)
  - Hooks: useShoppingList
  - JSX: SafeAreaView, View, Text, TouchableOpacity, Ionicons...
- **RootLayout** (src/app/_layout.tsx)
  - JSX: StatusBar, Stack, Stack.Screen
- **FavoritesScreen** (src/app/favorites.tsx)
  - Hooks: useRouter, useFavorites, useState, useEffect
  - JSX: SafeAreaView, View, ActivityIndicator, Ionicons, Text...
- **RecipeDetailScreen** (src/app/recipes/[id].tsx)
  - Hooks: useLocalSearchParams, useRouter, useState, useFavorites, useShoppingList, useMealPlan, useEffect
  - JSX: View, ActivityIndicator, Ionicons, Text, TouchableOpacity...

### Components (8)
- **CategoryChip**: 0 hooks, 3 elements
- **IngredientList**: 1 hooks, 4 elements
- **MealPlanDay**: 0 hooks, 5 elements
- **NutritionInfo**: 0 hooks, 2 elements
- **RecipeCard**: 1 hooks, 5 elements
- **ShoppingItem**: 0 hooks, 4 elements
- **StepByStep**: 1 hooks, 4 elements
- **index**: 0 hooks, 0 elements

### Hooks (4)
- **useFavorites**: deps []
- **useMealPlan**: deps []
- **useShoppingList**: deps []
- **useTheme**: deps [useColorScheme]

### Services (1)
- **recipes**: getCategories(async), getRecipes(async), getRecipeById(async), getFeaturedRecipes(async), searchRecipes(async)

### Navigation (expo-router)
- categories -> Categories
- index -> Index
- meal-plan -> Meal-plan
- profile -> Profile
- shopping -> Shopping
- favorites -> Favorites
- [id] -> [id]

### Types (15)
- interface Recipe
- interface Ingredient
- interface Step
- interface NutritionInfo
- interface Category
- interface ShoppingItem
- interface MealPlan
- interface PlannedMeal
- interface UserProfile
- type DietaryPreference
- interface ShoppingListState
- interface MealPlanState
- interface FavoritesState
- interface TimerState
- interface CookingTimer