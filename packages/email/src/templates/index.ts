/**
 * Email Templates Index
 */

export { TemplateEngine, templateEngine } from './template-engine.js';
export type { CompiledTemplate, RenderResult } from './template-engine.js';

export {
  welcomeTemplate,
  passwordResetTemplate,
  verificationTemplate,
  builtinTemplates,
} from './builtin/index.js';
