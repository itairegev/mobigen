/**
 * Built-in Email Templates Index
 */

export { welcomeTemplate } from './welcome.js';
export { passwordResetTemplate } from './password-reset.js';
export { verificationTemplate } from './verification.js';

import { welcomeTemplate } from './welcome.js';
import { passwordResetTemplate } from './password-reset.js';
import { verificationTemplate } from './verification.js';
import type { EmailTemplate } from '../../types.js';

export const builtinTemplates: EmailTemplate[] = [
  welcomeTemplate,
  passwordResetTemplate,
  verificationTemplate,
];
