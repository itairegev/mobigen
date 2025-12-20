import type { HookConfig, HookCallback, PostToolUseHookInput, PreToolUseHookInput } from '@mobigen/ai';
import { execSync } from 'child_process';

// Log all file modifications
const fileChangeLogger: HookCallback = async (input, toolUseId, { signal }) => {
  const postInput = input as PostToolUseHookInput;
  const filePath = postInput.tool_input?.file_path as string;

  console.log(`[${new Date().toISOString()}] Modified: ${filePath}`);

  return {};
};

// Run TypeScript check after edits
const typescriptValidator: HookCallback = async (input, toolUseId, { signal }) => {
  try {
    execSync('npx tsc --noEmit --skipLibCheck 2>&1 | head -20', {
      timeout: 30000,
    });
    return {};
  } catch (error) {
    console.warn('TypeScript check warning:', error);
    return {};
  }
};

// Prevent secret exposure (PreToolUse hook can block)
const secretGuard: HookCallback = async (input, toolUseId, context) => {
  const preInput = input as PreToolUseHookInput;
  const content = (preInput.tool_input?.content as string) || '';

  const secretPatterns = /(API_KEY|SECRET|PASSWORD|PRIVATE_KEY)\s*[:=]/i;
  if (secretPatterns.test(content)) {
    return {
      hookSpecificOutput: {
        hookEventName: preInput.hook_event_name,
        permissionDecision: 'deny',
        permissionDecisionReason: 'Content appears to contain secrets',
      },
    };
  }
  return {};
};

// Configure hooks for query() options
export function createQAHooks(projectId: string): HookConfig {
  return {
    PreToolUse: [
      {
        matcher: 'Write|Edit',
        hooks: [secretGuard],
      },
    ],
    PostToolUse: [
      {
        matcher: 'Edit|Write',
        hooks: [fileChangeLogger],
      },
      {
        matcher: 'Edit',
        hooks: [typescriptValidator],
      },
    ],
  };
}
