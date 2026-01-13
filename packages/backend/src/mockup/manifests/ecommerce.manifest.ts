/**
 * E-Commerce Template Mockup Manifest
 *
 * Defines screens, navigation, and default branding for the e-commerce template
 */

import { MockupManifest } from '@mobigen/ui/mockup';

export const ecommerceManifest: MockupManifest = {
  templateId: 'ecommerce',
  version: '1.0.0',

  screens: [
    {
      id: 'home',
      title: 'Home',
      description: 'Featured products and categories',
      route: '/',
      html: `
        <div class="screen-header">
          <h2 class="text-2xl font-bold">Featured Products</h2>
        </div>
        <div class="product-grid">
          <div class="product-card">
            <div class="product-image"></div>
            <h3 class="product-title">Premium Headphones</h3>
            <p class="product-price">$99.99</p>
          </div>
          <div class="product-card">
            <div class="product-image"></div>
            <h3 class="product-title">Wireless Mouse</h3>
            <p class="product-price">$29.99</p>
          </div>
          <div class="product-card">
            <div class="product-image"></div>
            <h3 class="product-title">Laptop Stand</h3>
            <p class="product-price">$49.99</p>
          </div>
          <div class="product-card">
            <div class="product-image"></div>
            <h3 class="product-title">USB-C Cable</h3>
            <p class="product-price">$14.99</p>
          </div>
        </div>
      `,
      customCSS: `
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .product-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .product-image {
          width: 100%;
          height: 120px;
          background: #f0f0f0;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        .product-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .product-price {
          font-size: 16px;
          font-weight: bold;
          color: var(--primary-color);
        }
      `,
      hotspots: [
        { id: 'product-1', x: 16, y: 100, width: 150, height: 180, targetScreen: 'product-detail' },
      ],
    },

    {
      id: 'categories',
      title: 'Categories',
      description: 'Browse products by category',
      route: '/categories',
      html: `
        <div class="screen-header">
          <h2 class="text-2xl font-bold">Shop by Category</h2>
        </div>
        <div class="category-list">
          <div class="category-item">
            <div class="category-icon">📱</div>
            <span>Electronics</span>
          </div>
          <div class="category-item">
            <div class="category-icon">👕</div>
            <span>Fashion</span>
          </div>
          <div class="category-item">
            <div class="category-icon">🏠</div>
            <span>Home & Garden</span>
          </div>
          <div class="category-item">
            <div class="category-icon">🎮</div>
            <span>Gaming</span>
          </div>
          <div class="category-item">
            <div class="category-icon">📚</div>
            <span>Books</span>
          </div>
          <div class="category-item">
            <div class="category-icon">🏃</div>
            <span>Sports</span>
          </div>
        </div>
      `,
      customCSS: `
        .category-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }
        .category-item {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .category-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }
      `,
      hotspots: [],
    },

    {
      id: 'cart',
      title: 'Cart',
      description: 'Shopping cart with checkout',
      route: '/cart',
      html: `
        <div class="screen-header">
          <h2 class="text-2xl font-bold">Shopping Cart</h2>
          <span class="badge">3 items</span>
        </div>
        <div class="cart-items">
          <div class="cart-item">
            <div class="item-image"></div>
            <div class="item-details">
              <h3>Premium Headphones</h3>
              <p class="item-price">$99.99</p>
              <div class="quantity">Qty: 1</div>
            </div>
          </div>
          <div class="cart-item">
            <div class="item-image"></div>
            <div class="item-details">
              <h3>Wireless Mouse</h3>
              <p class="item-price">$29.99</p>
              <div class="quantity">Qty: 2</div>
            </div>
          </div>
        </div>
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>$159.97</span>
          </div>
          <div class="summary-row">
            <span>Shipping:</span>
            <span>$10.00</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>$169.97</span>
          </div>
          <button class="checkout-button">Proceed to Checkout</button>
        </div>
      `,
      customCSS: `
        .badge {
          background: var(--primary-color);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-left: 8px;
        }
        .cart-items {
          margin-top: 16px;
        }
        .cart-item {
          background: white;
          border-radius: 12px;
          padding: 12px;
          margin-bottom: 12px;
          display: flex;
          gap: 12px;
        }
        .item-image {
          width: 80px;
          height: 80px;
          background: #f0f0f0;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .item-details {
          flex: 1;
        }
        .item-price {
          font-weight: 600;
          color: var(--primary-color);
          margin: 4px 0;
        }
        .quantity {
          font-size: 14px;
          color: #6B7280;
        }
        .cart-summary {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .summary-row.total {
          font-size: 18px;
          font-weight: bold;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .checkout-button {
          width: 100%;
          padding: 16px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          margin-top: 12px;
        }
      `,
      hotspots: [],
    },

    {
      id: 'profile',
      title: 'Profile',
      description: 'User account and settings',
      route: '/profile',
      html: `
        <div class="profile-header">
          <div class="avatar">JD</div>
          <h2>John Doe</h2>
          <p class="email">john.doe@example.com</p>
        </div>
        <div class="menu-section">
          <div class="menu-item">
            <span>📦</span>
            <span>My Orders</span>
          </div>
          <div class="menu-item">
            <span>❤️</span>
            <span>Wishlist</span>
          </div>
          <div class="menu-item">
            <span>📍</span>
            <span>Addresses</span>
          </div>
          <div class="menu-item">
            <span>💳</span>
            <span>Payment Methods</span>
          </div>
          <div class="menu-item">
            <span>⚙️</span>
            <span>Settings</span>
          </div>
          <div class="menu-item">
            <span>❓</span>
            <span>Help & Support</span>
          </div>
        </div>
      `,
      customCSS: `
        .profile-header {
          text-align: center;
          padding: 32px 16px;
          background: white;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 40px;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          margin: 0 auto 16px;
        }
        .email {
          color: #6B7280;
          margin-top: 4px;
        }
        .menu-section {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }
        .menu-item {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .menu-item:last-child {
          border-bottom: none;
        }
        .menu-item span:first-child {
          font-size: 20px;
        }
      `,
      hotspots: [],
    },

    {
      id: 'product-detail',
      title: 'Product Detail',
      description: 'Detailed product information',
      route: '/product/[id]',
      html: `
        <div class="product-hero">
          <div class="product-image-large"></div>
        </div>
        <div class="product-info">
          <h1 class="product-title-large">Premium Headphones</h1>
          <div class="rating">
            <span>⭐⭐⭐⭐⭐</span>
            <span>(128 reviews)</span>
          </div>
          <p class="price-large">$99.99</p>
          <p class="description">
            High-quality wireless headphones with noise cancellation.
            Perfect for music lovers and professionals.
          </p>
          <button class="add-to-cart-button">Add to Cart</button>
        </div>
      `,
      customCSS: `
        .product-hero {
          height: 300px;
          background: #f0f0f0;
        }
        .product-image-large {
          width: 100%;
          height: 100%;
        }
        .product-info {
          padding: 16px;
        }
        .product-title-large {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .rating {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
          color: #6B7280;
          font-size: 14px;
        }
        .price-large {
          font-size: 32px;
          font-weight: bold;
          color: var(--primary-color);
          margin-bottom: 16px;
        }
        .description {
          color: #6B7280;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .add-to-cart-button {
          width: 100%;
          padding: 16px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
        }
      `,
      hotspots: [],
    },
  ],

  navigation: {
    type: 'tabs',
    tabs: [
      { id: 'home', label: 'Home', icon: '🏠', screen: 'home' },
      { id: 'categories', label: 'Categories', icon: '📂', screen: 'categories' },
      { id: 'cart', label: 'Cart', icon: '🛒', screen: 'cart' },
      { id: 'profile', label: 'Profile', icon: '👤', screen: 'profile' },
    ],
  },

  branding: {
    defaultPrimaryColor: '#0EA5E9',
    defaultSecondaryColor: '#0284C7',
    defaultAccentColor: '#38BDF8',
    colorAreas: [
      { selector: '.app-header', property: 'background', appliesTo: 'primaryColor' },
      { selector: '.button', property: 'background', appliesTo: 'primaryColor' },
      { selector: '.product-price', property: 'color', appliesTo: 'primaryColor' },
      { selector: '.checkout-button', property: 'background', appliesTo: 'primaryColor' },
    ],
    logoPositions: {
      appHeader: { x: 16, y: 16, width: 40, height: 40, anchor: 'top-left' },
    },
    textReplacements: [
      { find: '{{APP_NAME}}', selector: '.app-name', replaceWith: 'appName' },
    ],
  },
};
