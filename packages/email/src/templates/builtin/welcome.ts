/**
 * Welcome Email Template
 */

import type { EmailTemplate } from '../../types.js';

export const welcomeTemplate: EmailTemplate = {
  id: 'welcome',
  name: 'Welcome Email',
  subject: 'Welcome to {{appName}}, {{userName}}!',
  variables: ['appName', 'userName', 'loginUrl'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{appName}}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { max-width: 150px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to {{appName}}!</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>Thank you for joining {{appName}}! We're excited to have you on board.</p>
      <p>You can now access all the features of your account by logging in:</p>
      <p style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Log In to Your Account</a>
      </p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
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
Welcome to {{appName}}!

Hi {{userName}},

Thank you for joining {{appName}}! We're excited to have you on board.

You can now access all the features of your account by logging in:
{{loginUrl}}

If you have any questions, feel free to reach out to our support team.

Best regards,
The {{appName}} Team
  `.trim(),
};
