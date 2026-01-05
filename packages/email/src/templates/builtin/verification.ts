/**
 * Email Verification Template
 */

import type { EmailTemplate } from '../../types.js';

export const verificationTemplate: EmailTemplate = {
  id: 'email-verification',
  name: 'Email Verification',
  subject: 'Verify your email for {{appName}}',
  variables: ['appName', 'userName', 'verificationUrl', 'verificationCode'],
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .code-box { background: #fff; border: 2px dashed #d1d5db; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>Thanks for signing up for {{appName}}! Please verify your email address to get started.</p>
      <p>Click the button below to verify your email:</p>
      <p style="text-align: center;">
        <a href="{{verificationUrl}}" class="button">Verify Email Address</a>
      </p>
      <p>Or enter this verification code manually:</p>
      <div class="code-box">
        <span class="code">{{verificationCode}}</span>
      </div>
      <p>If you didn't create an account with {{appName}}, you can safely ignore this email.</p>
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
Verify Your Email

Hi {{userName}},

Thanks for signing up for {{appName}}! Please verify your email address to get started.

Click the link below to verify your email:
{{verificationUrl}}

Or enter this verification code manually:
{{verificationCode}}

If you didn't create an account with {{appName}}, you can safely ignore this email.

Best regards,
The {{appName}} Team
  `.trim(),
};
