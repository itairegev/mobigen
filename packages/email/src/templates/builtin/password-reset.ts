/**
 * Password Reset Email Template
 */

import type { EmailTemplate } from '../../types.js';

export const passwordResetTemplate: EmailTemplate = {
  id: 'password-reset',
  name: 'Password Reset',
  subject: 'Reset your {{appName}} password',
  variables: ['appName', 'userName', 'resetUrl', 'expiresIn'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
    .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>We received a request to reset your password for your {{appName}} account.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </p>
      <div class="warning">
        <strong>⚠️ This link expires in {{expiresIn}}.</strong>
        <p style="margin: 5px 0 0 0;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #6b7280;">{{resetUrl}}</p>
      <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
      <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim(),
  text: `
Password Reset Request

Hi {{userName}},

We received a request to reset your password for your {{appName}} account.

Click the link below to reset your password:
{{resetUrl}}

⚠️ This link expires in {{expiresIn}}.
If you didn't request a password reset, you can safely ignore this email.

Best regards,
The {{appName}} Team
  `.trim(),
};
