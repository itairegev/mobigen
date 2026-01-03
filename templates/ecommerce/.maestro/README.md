# Maestro E2E Tests - E-commerce Template

This directory contains Maestro end-to-end tests for the Mobigen e-commerce template.

## Test Files

### Core Tests (Critical)

- **`navigation.yaml`** - Tests tab navigation across Shop, Categories, Cart, and Profile
- **`browse-products.yaml`** - Tests product browsing, search, and filtering functionality
- **`e2e-happy-path.yaml`** - Complete user journey from browsing to checkout

### Feature Tests

- **`categories.yaml`** - Tests category browsing and navigation
- **`product-detail.yaml`** - Tests product detail view (requires product/[id] screen)
- **`cart.yaml`** - Tests empty cart state and navigation
- **`cart-operations.yaml`** - Tests cart operations with items (add, update, remove)
- **`checkout.yaml`** - Tests checkout flow (requires checkout screen)

### Configuration

- **`config.yaml`** - App configuration with bundle ID and environment variables

## Running Tests

### Local Testing (with Maestro CLI)

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all tests
maestro test .maestro/

# Run specific test
maestro test .maestro/navigation.yaml

# Run tests with specific tag
maestro test .maestro/ --tags smoke
```

### Cloud Testing (Maestro Cloud)

```bash
# Upload and run on Maestro Cloud
maestro cloud .maestro/ --app-file path/to/app.apk

# Run specific platform
maestro cloud .maestro/ --app-file path/to/app.ipa --platform ios
```

## Test Tags

Tests are organized with the following tags:

- **`critical`** - Must-pass tests for core functionality
- **`smoke`** - Quick smoke tests for basic functionality
- **`e2e`** - End-to-end user journey tests
- **`navigation`** - Navigation-specific tests
- **`products`** - Product browsing and detail tests
- **`cart`** - Shopping cart tests
- **`checkout`** - Checkout flow tests
- **`categories`** - Category browsing tests
- **`search`** - Search functionality tests
- **`operations`** - CRUD operation tests

## Test IDs Reference

The tests use the following `testID` props from the components:

### Screens

- `search-input` - Product search input
- `browse-products-button` - Button to navigate from empty cart to shop
- `checkout-button` - Proceed to checkout button

### Products

- `product-{id}` - Product card (e.g., `product-1`, `product-2`)
- `product-{id}-favorite` - Favorite button on product card

### Cart Items

- `cart-item-{id}` - Cart item container
- `cart-item-{id}-increase` - Increase quantity button
- `cart-item-{id}-decrease` - Decrease quantity button
- `cart-item-{id}-remove` - Remove item button

### Categories

- `category-{id}` - Category card (e.g., `category-electronics`)

## Current Limitations

Some tests have placeholders for features not yet implemented:

1. **Product Detail Screen** - `product/[id].tsx` route needs implementation
2. **Checkout Screen** - `/checkout` route needs implementation
3. **Category Detail** - `/category/[id]` route needs implementation
4. **Add to Cart** - Requires product detail screen with add to cart functionality

These tests are structured to document expected behavior and can be fully enabled once the corresponding screens are implemented.

## Test Maintenance

When adding new screens or features:

1. Add appropriate `testID` props to interactive elements
2. Create corresponding test files following naming convention
3. Add relevant tags for test categorization
4. Update this README with new test IDs and test files
5. Run tests locally before committing

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Maestro Tests
  run: |
    maestro test .maestro/ --format junit --output test-results.xml
```

## Best Practices

1. **Self-contained tests** - Each test should launch the app fresh with `clearState: true`
2. **Explicit waits** - Use `waitForAnimationToEnd` after navigation or state changes
3. **Regex patterns** - Use regex for dynamic content (e.g., product counts, prices)
4. **Conditional flows** - Use `runFlow.when` for conditional test paths
5. **Clear assertions** - Assert on specific `testID` props when possible
6. **Descriptive names** - Use clear, descriptive file names and test descriptions

## Support

For Maestro documentation and support:
- [Maestro Documentation](https://maestro.mobile.dev)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
