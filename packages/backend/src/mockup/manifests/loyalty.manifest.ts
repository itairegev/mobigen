/**
 * Loyalty & Rewards Template Mockup Manifest
 *
 * Defines screens, navigation, and default branding for the loyalty template
 */

import { MockupManifest } from '@mobigen/ui/mockup';

export const loyaltyManifest: MockupManifest = {
  templateId: 'loyalty',
  version: '1.0.0',

  screens: [
    {
      id: 'home',
      title: 'Home',
      description: 'Points balance and rewards overview',
      route: '/',
      html: `
        <div class="points-card">
          <div class="points-balance">
            <h2>Your Points</h2>
            <div class="points-number">2,450</div>
            <p class="points-value">≈ $24.50 in rewards</p>
          </div>
          <div class="tier-badge">
            <span>🏆</span>
            <span>Gold Member</span>
          </div>
        </div>
        <div class="quick-actions">
          <button class="action-btn">
            <span>📷</span>
            <span>Scan QR</span>
          </button>
          <button class="action-btn">
            <span>🎁</span>
            <span>Rewards</span>
          </button>
          <button class="action-btn">
            <span>📊</span>
            <span>History</span>
          </button>
        </div>
        <div class="featured-rewards">
          <h3 class="section-title">Featured Rewards</h3>
          <div class="reward-card">
            <div class="reward-icon">☕</div>
            <div class="reward-info">
              <h4>Free Coffee</h4>
              <p>500 points</p>
            </div>
          </div>
          <div class="reward-card">
            <div class="reward-icon">🍰</div>
            <div class="reward-info">
              <h4>Free Dessert</h4>
              <p>750 points</p>
            </div>
          </div>
        </div>
      `,
      customCSS: `
        .points-card {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 16px;
        }
        .points-balance {
          text-align: center;
          margin-bottom: 16px;
        }
        .points-number {
          font-size: 48px;
          font-weight: bold;
          margin: 8px 0;
        }
        .points-value {
          opacity: 0.9;
        }
        .tier-badge {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 8px 16px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .action-btn {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .action-btn span:first-child {
          font-size: 32px;
        }
        .action-btn span:last-child {
          font-size: 12px;
          font-weight: 600;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .reward-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .reward-icon {
          font-size: 40px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-center;
          background: #f0f0f0;
          border-radius: 12px;
        }
        .reward-info h4 {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .reward-info p {
          color: var(--primary-color);
          font-weight: 600;
        }
      `,
      hotspots: [],
    },

    {
      id: 'rewards',
      title: 'Rewards',
      description: 'Available rewards catalog',
      route: '/rewards',
      html: `
        <div class="screen-header">
          <h2 class="text-2xl font-bold">Rewards Catalog</h2>
        </div>
        <div class="rewards-list">
          <div class="reward-item">
            <div class="reward-icon-large">☕</div>
            <div class="reward-details">
              <h3>Free Coffee</h3>
              <p class="reward-description">Any size, any drink</p>
              <div class="reward-points">500 points</div>
            </div>
            <button class="redeem-btn">Redeem</button>
          </div>
          <div class="reward-item">
            <div class="reward-icon-large">🍰</div>
            <div class="reward-details">
              <h3>Free Dessert</h3>
              <p class="reward-description">Choose from selection</p>
              <div class="reward-points">750 points</div>
            </div>
            <button class="redeem-btn">Redeem</button>
          </div>
          <div class="reward-item">
            <div class="reward-icon-large">🥪</div>
            <div class="reward-details">
              <h3>Free Sandwich</h3>
              <p class="reward-description">Premium sandwiches</p>
              <div class="reward-points">1000 points</div>
            </div>
            <button class="redeem-btn">Redeem</button>
          </div>
          <div class="reward-item">
            <div class="reward-icon-large">💝</div>
            <div class="reward-details">
              <h3>$10 Gift Card</h3>
              <p class="reward-description">Use on anything</p>
              <div class="reward-points">2000 points</div>
            </div>
            <button class="redeem-btn">Redeem</button>
          </div>
        </div>
      `,
      customCSS: `
        .rewards-list {
          margin-top: 16px;
        }
        .reward-item {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .reward-icon-large {
          font-size: 48px;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .reward-details {
          flex: 1;
        }
        .reward-details h3 {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .reward-description {
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 4px;
        }
        .reward-points {
          font-weight: 600;
          color: var(--primary-color);
        }
        .redeem-btn {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }
      `,
      hotspots: [],
    },

    {
      id: 'scan',
      title: 'Scan',
      description: 'QR code scanner for earning points',
      route: '/scan',
      html: `
        <div class="scanner-container">
          <div class="scanner-frame">
            <div class="scanner-corner top-left"></div>
            <div class="scanner-corner top-right"></div>
            <div class="scanner-corner bottom-left"></div>
            <div class="scanner-corner bottom-right"></div>
            <div class="scanner-line"></div>
          </div>
          <p class="scanner-instruction">Scan QR code to earn points</p>
        </div>
        <div class="recent-scans">
          <h3 class="section-title">Recent Transactions</h3>
          <div class="scan-item">
            <div class="scan-icon">✅</div>
            <div class="scan-info">
              <h4>Points Earned</h4>
              <p>2 minutes ago</p>
            </div>
            <div class="scan-points">+50</div>
          </div>
          <div class="scan-item">
            <div class="scan-icon">✅</div>
            <div class="scan-info">
              <h4>Points Earned</h4>
              <p>1 hour ago</p>
            </div>
            <div class="scan-points">+75</div>
          </div>
          <div class="scan-item">
            <div class="scan-icon">🎁</div>
            <div class="scan-info">
              <h4>Reward Redeemed</h4>
              <p>Yesterday</p>
            </div>
            <div class="scan-points">-500</div>
          </div>
        </div>
      `,
      customCSS: `
        .scanner-container {
          padding: 32px 16px;
          text-align: center;
        }
        .scanner-frame {
          width: 280px;
          height: 280px;
          margin: 0 auto 16px;
          background: #f0f0f0;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .scanner-corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 3px solid var(--primary-color);
        }
        .scanner-corner.top-left {
          top: 20px;
          left: 20px;
          border-right: none;
          border-bottom: none;
        }
        .scanner-corner.top-right {
          top: 20px;
          right: 20px;
          border-left: none;
          border-bottom: none;
        }
        .scanner-corner.bottom-left {
          bottom: 20px;
          left: 20px;
          border-right: none;
          border-top: none;
        }
        .scanner-corner.bottom-right {
          bottom: 20px;
          right: 20px;
          border-left: none;
          border-top: none;
        }
        .scanner-line {
          position: absolute;
          top: 50%;
          left: 20px;
          right: 20px;
          height: 2px;
          background: var(--primary-color);
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes scan {
          0%, 100% { transform: translateY(-100px); }
          50% { transform: translateY(100px); }
        }
        .scanner-instruction {
          color: #6B7280;
          margin-bottom: 24px;
        }
        .recent-scans {
          background: white;
          border-radius: 12px;
          padding: 16px;
        }
        .scan-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .scan-item:last-child {
          border-bottom: none;
        }
        .scan-icon {
          font-size: 24px;
        }
        .scan-info {
          flex: 1;
        }
        .scan-info h4 {
          font-weight: 600;
          font-size: 14px;
        }
        .scan-info p {
          font-size: 12px;
          color: #6B7280;
        }
        .scan-points {
          font-weight: bold;
          color: var(--primary-color);
        }
      `,
      hotspots: [],
    },

    {
      id: 'profile',
      title: 'Profile',
      description: 'Account details and tier status',
      route: '/profile',
      html: `
        <div class="profile-card">
          <div class="avatar-large">JD</div>
          <h2>John Doe</h2>
          <div class="tier-status">
            <span class="tier-icon">🏆</span>
            <span>Gold Member</span>
          </div>
          <div class="tier-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 70%"></div>
            </div>
            <p class="progress-text">700 points to Platinum</p>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">2,450</div>
            <div class="stat-label">Total Points</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">12</div>
            <div class="stat-label">Rewards Redeemed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">48</div>
            <div class="stat-label">Visits</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">$450</div>
            <div class="stat-label">Total Spent</div>
          </div>
        </div>
        <div class="menu-section">
          <div class="menu-item">
            <span>📜</span>
            <span>Transaction History</span>
          </div>
          <div class="menu-item">
            <span>🎯</span>
            <span>My Tier Benefits</span>
          </div>
          <div class="menu-item">
            <span>⚙️</span>
            <span>Settings</span>
          </div>
        </div>
      `,
      customCSS: `
        .profile-card {
          background: white;
          border-radius: 16px;
          padding: 32px 16px;
          text-align: center;
          margin-bottom: 16px;
        }
        .avatar-large {
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
        .tier-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: white;
          padding: 8px 16px;
          border-radius: 24px;
          font-weight: 600;
          margin-top: 8px;
        }
        .tier-progress {
          margin-top: 16px;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .progress-fill {
          height: 100%;
          background: var(--primary-color);
        }
        .progress-text {
          font-size: 12px;
          color: #6B7280;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary-color);
        }
        .stat-label {
          font-size: 12px;
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
  ],

  navigation: {
    type: 'tabs',
    tabs: [
      { id: 'home', label: 'Home', icon: '🏠', screen: 'home' },
      { id: 'rewards', label: 'Rewards', icon: '🎁', screen: 'rewards' },
      { id: 'scan', label: 'Scan', icon: '📷', screen: 'scan' },
      { id: 'profile', label: 'Profile', icon: '👤', screen: 'profile' },
    ],
  },

  branding: {
    defaultPrimaryColor: '#8B5CF6',
    defaultSecondaryColor: '#7C3AED',
    defaultAccentColor: '#A78BFA',
    colorAreas: [
      { selector: '.points-card', property: 'background', appliesTo: 'primaryColor' },
      { selector: '.reward-points', property: 'color', appliesTo: 'primaryColor' },
      { selector: '.redeem-btn', property: 'background', appliesTo: 'primaryColor' },
      { selector: '.scanner-corner', property: 'border-color', appliesTo: 'primaryColor' },
    ],
    logoPositions: {
      appHeader: { x: 16, y: 16, width: 40, height: 40, anchor: 'top-left' },
    },
    textReplacements: [
      { find: '{{APP_NAME}}', selector: '.app-name', replaceWith: 'appName' },
    ],
  },
};
