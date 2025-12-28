/**
 * GitHub OAuth Flow Implementation
 */

import crypto from 'crypto';
import type { GitHubOAuthConfig, GitHubTokens, GitHubUser, OAuthState } from './types';
import { GitHubOAuthError } from './errors';

// Default OAuth configuration
const DEFAULT_SCOPES = ['repo', 'read:user', 'user:email'];
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Get OAuth configuration from environment
 */
export function getOAuthConfig(): GitHubOAuthConfig {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = process.env.GITHUB_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;

  if (!clientId || !clientSecret) {
    throw new GitHubOAuthError('GitHub OAuth not configured: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET');
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes: DEFAULT_SCOPES,
  };
}

/**
 * Get the state signing secret
 */
function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new GitHubOAuthError('OAUTH_STATE_SECRET not configured');
  }
  return secret;
}

/**
 * Encode OAuth state with HMAC signature for CSRF protection
 */
export function encodeState(data: Omit<OAuthState, 'timestamp'>): string {
  const secret = getStateSecret();
  const state: OAuthState = {
    ...data,
    timestamp: Date.now(),
  };

  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Decode and verify OAuth state
 */
export function decodeState(state: string): OAuthState {
  const secret = getStateSecret();
  const parts = state.split('.');

  if (parts.length !== 2) {
    throw new GitHubOAuthError('Invalid state format');
  }

  const [payload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    throw new GitHubOAuthError('Invalid state signature');
  }

  // Parse payload
  let data: OAuthState;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  } catch {
    throw new GitHubOAuthError('Invalid state payload');
  }

  // Check TTL
  if (Date.now() - data.timestamp > STATE_TTL_MS) {
    throw new GitHubOAuthError('State expired');
  }

  return data;
}

/**
 * Generate GitHub OAuth authorization URL
 */
export function getOAuthUrl(state: string): string {
  const config = getOAuthConfig();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(' '),
    state,
    allow_signup: 'true',
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GitHubTokens> {
  const config = getOAuthConfig();

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new GitHubOAuthError(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json() as {
    error?: string;
    error_description?: string;
    access_token?: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (data.error) {
    throw new GitHubOAuthError(data.error_description || data.error);
  }

  if (!data.access_token) {
    throw new GitHubOAuthError('No access token in response');
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type || 'bearer',
    scope: data.scope || '',
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Get GitHub user info using access token
 */
export async function getUserInfo(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Mobigen/1.0',
    },
  });

  if (!response.ok) {
    throw new GitHubOAuthError(`Failed to get user info: ${response.status}`);
  }

  const user = await response.json() as GitHubUser;

  // If email is not public, fetch from emails endpoint
  if (!user.email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Mobigen/1.0',
      },
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json() as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      const primaryEmail = emails.find(e => e.primary && e.verified);
      if (primaryEmail) {
        user.email = primaryEmail.email;
      }
    }
  }

  return user;
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GitHubTokens> {
  const config = getOAuthConfig();

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new GitHubOAuthError(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json() as {
    error?: string;
    error_description?: string;
    access_token?: string;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (data.error) {
    throw new GitHubOAuthError(data.error_description || data.error);
  }

  if (!data.access_token) {
    throw new GitHubOAuthError('No access token in refresh response');
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type || 'bearer',
    scope: data.scope || '',
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}
