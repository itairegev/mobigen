/**
 * Skill Tool - Invoke reusable skills
 *
 * Allows the AI orchestrator to use predefined skills
 * loaded from the skill registry.
 */

import type { Tool, ToolDefinition, ToolHandler, ToolResult, ToolParameterSchema } from './types.js';

/**
 * Skill definition interface (matches registry format)
 */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  prompt: string;
  capabilities?: string[];
  category?: string;
  tools?: string[];
  compatibleAgents?: string[];
  inputs?: SkillInput[];
  outputs?: SkillOutput[];
  parallelizable?: boolean;
  priority?: number;
  filePath: string;
}

export interface SkillInput {
  name: string;
  description: string;
  type: string;
  required?: boolean;
  default?: unknown;
}

export interface SkillOutput {
  name: string;
  description: string;
  type: string;
}

/**
 * Input for the Skill tool
 */
export interface SkillToolInput {
  /** Skill ID to invoke */
  skill_id: string;
  /** Inputs to pass to the skill */
  inputs?: Record<string, unknown>;
}

/**
 * Skill Tool Configuration
 */
export interface SkillToolConfig {
  /** Get a skill by ID */
  getSkill: (skillId: string) => SkillDefinition | undefined;
  /** List all available skills */
  listSkills: () => SkillDefinition[];
  /** Find skills by capability */
  findByCapability: (capability: string) => SkillDefinition[];
  /** Find skills compatible with an agent */
  findCompatibleSkills: (agentId: string) => SkillDefinition[];
}

/**
 * Create a Skill tool instance
 */
export function createSkillTool(config: SkillToolConfig): Tool {
  const skills = config.listSkills();

  const definition: ToolDefinition = {
    name: 'Skill',
    description: `Invoke a reusable skill. Skills are best practices and patterns for common development tasks.

Available skills:
${skills.map(s => {
  const inputs = s.inputs?.map(i => `${i.name}${i.required ? '' : '?'}`).join(', ') || '';
  return `- ${s.id}${inputs ? ` (${inputs})` : ''}: ${s.description}`;
}).join('\n')}

Skills provide context and patterns for the current agent to follow.`,
    input_schema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'string',
          description: 'The skill ID to invoke',
          enum: skills.map(s => s.id),
        },
        inputs: {
          type: 'object',
          description: 'Inputs to pass to the skill',
        },
      },
      required: ['skill_id'],
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const skillInput = input as unknown as SkillToolInput;
    const { skill_id, inputs } = skillInput;

    // Get skill
    const skill = config.getSkill(skill_id);
    if (!skill) {
      const available = config.listSkills().map(s => s.id).join(', ');
      return {
        success: false,
        error: `Skill '${skill_id}' not found. Available: ${available}`,
      };
    }

    // Validate required inputs
    if (skill.inputs) {
      for (const inp of skill.inputs) {
        if (inp.required && (!inputs || inputs[inp.name] === undefined)) {
          return {
            success: false,
            error: `Missing required input '${inp.name}' for skill ${skill_id}`,
          };
        }
      }
    }

    // Build context with skill prompt and inputs
    let expandedPrompt = skill.prompt;

    // Substitute inputs in the prompt
    if (inputs) {
      for (const [key, value] of Object.entries(inputs)) {
        const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
        expandedPrompt = expandedPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), valueStr);
        expandedPrompt = expandedPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), valueStr);
      }
    }

    // Fill in defaults for missing inputs
    if (skill.inputs) {
      for (const inp of skill.inputs) {
        if (inp.default !== undefined && (!inputs || inputs[inp.name] === undefined)) {
          const valueStr = typeof inp.default === 'string' ? inp.default : JSON.stringify(inp.default);
          expandedPrompt = expandedPrompt.replace(new RegExp(`\\{${inp.name}\\}`, 'g'), valueStr);
          expandedPrompt = expandedPrompt.replace(new RegExp(`\\$\\{${inp.name}\\}`, 'g'), valueStr);
        }
      }
    }

    // Return the skill context for the agent to use
    return {
      success: true,
      output: {
        skill_id,
        name: skill.name,
        context: expandedPrompt,
        capabilities: skill.capabilities,
        tools: skill.tools,
        outputs: skill.outputs,
        parallelizable: skill.parallelizable,
      },
    };
  };

  return { definition, handler };
}

/**
 * Create a FindSkills tool for discovery
 */
export function createFindSkillsTool(config: SkillToolConfig): Tool {
  const definition: ToolDefinition = {
    name: 'FindSkills',
    description: 'Find skills by capability or agent compatibility',
    input_schema: {
      type: 'object',
      properties: {
        capability: {
          type: 'string',
          description: 'Find skills with this capability',
        },
        agent_id: {
          type: 'string',
          description: 'Find skills compatible with this agent',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
      },
    } as ToolParameterSchema,
  };

  const handler: ToolHandler = async (input: Record<string, unknown>): Promise<ToolResult> => {
    const capability = input.capability as string | undefined;
    const agentId = input.agent_id as string | undefined;
    const category = input.category as string | undefined;

    let skills = config.listSkills();

    if (capability) {
      skills = skills.filter(s => s.capabilities?.includes(capability));
    }

    if (agentId) {
      skills = skills.filter(s =>
        !s.compatibleAgents || s.compatibleAgents.includes(agentId)
      );
    }

    if (category) {
      skills = skills.filter(s => s.category === category);
    }

    const formatted = skills.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      capabilities: s.capabilities,
      category: s.category,
      parallelizable: s.parallelizable,
      priority: s.priority,
    }));

    // Sort by priority
    formatted.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return {
      success: true,
      output: {
        count: formatted.length,
        skills: formatted,
      },
    };
  };

  return { definition, handler };
}
