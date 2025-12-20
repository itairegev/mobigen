# @mobigen/ai

Claude AI SDK integration and agent definitions for Mobigen.

## Overview

This package provides the AI infrastructure for Mobigen's code generation pipeline. It wraps the Anthropic SDK and defines specialized agents for each phase of app generation.

## Tech Stack

- **AI Provider**: Anthropic Claude API
- **SDK**: @anthropic-ai/sdk
- **Validation**: Zod schemas
- **Language**: TypeScript (ESM)

## Installation

```bash
pnpm add @mobigen/ai
```

## Features

- Claude API client wrapper
- Multi-agent orchestration
- Streaming response support
- Token usage tracking
- Rate limiting helpers
- Prompt templates

## Directory Structure

```
src/
├── index.ts              # Main exports
├── client.ts             # Anthropic client wrapper
├── agents/               # Agent definitions
│   ├── index.ts          # Agent exports
│   ├── intent.ts         # Intent analysis agent
│   ├── prd.ts            # PRD generation agent
│   ├── architect.ts      # Architecture design agent
│   ├── ui.ts             # UI/UX planning agent
│   ├── task.ts           # Task breakdown agent
│   ├── implementation.ts # Code generation agent
│   └── qa.ts             # Quality assurance agent
├── prompts/              # Prompt templates
│   ├── system.ts         # System prompts
│   └── templates.ts      # Reusable templates
├── types/                # TypeScript types
│   └── index.ts
└── utils/                # Utilities
    ├── tokens.ts         # Token counting
    └── streaming.ts      # Stream helpers
```

## Usage

### Basic Client

```typescript
import { createClient, chat } from '@mobigen/ai';

// Create client
const client = createClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Simple chat
const response = await chat(client, {
  model: 'claude-3-sonnet-20240229',
  messages: [
    { role: 'user', content: 'Hello, Claude!' }
  ],
});
```

### Using Agents

```typescript
import {
  IntentAgent,
  PRDAgent,
  ArchitectAgent
} from '@mobigen/ai/agents';

// Create intent agent
const intentAgent = new IntentAgent(client);

// Analyze user intent
const intent = await intentAgent.analyze({
  userInput: 'I want to build an e-commerce app with product listings and cart',
  templateContext: { /* template info */ },
});

// Generate PRD from intent
const prdAgent = new PRDAgent(client);
const prd = await prdAgent.generate({
  intent,
  templateContext: { /* template info */ },
});
```

### Streaming Responses

```typescript
import { streamChat } from '@mobigen/ai';

const stream = await streamChat(client, {
  model: 'claude-3-sonnet-20240229',
  messages: [{ role: 'user', content: 'Generate a React component' }],
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta?.text || '');
}
```

### Token Tracking

```typescript
import { countTokens, estimateCost } from '@mobigen/ai/utils';

const tokens = countTokens(text);
const cost = estimateCost({
  model: 'claude-3-sonnet-20240229',
  inputTokens: 1000,
  outputTokens: 2000,
});
```

## Agents

### IntentAgent

Analyzes user input to extract:
- App purpose and goals
- Required features
- Target audience
- Technical requirements

### PRDAgent

Generates Product Requirements Document:
- Feature specifications
- User stories
- Acceptance criteria
- Priority ranking

### ArchitectAgent

Designs technical architecture:
- Component structure
- Data models
- API design
- State management approach

### UIAgent

Plans UI/UX:
- Screen layouts
- Navigation flow
- Component hierarchy
- Styling approach

### TaskAgent

Breaks down into implementation tasks:
- File-level tasks
- Dependencies between tasks
- Estimated complexity
- Priority order

### ImplementationAgent

Generates actual code:
- TypeScript/React Native code
- Following template patterns
- Proper imports and exports
- Type definitions

### QAAgent

Reviews generated code:
- TypeScript errors
- ESLint violations
- Best practices
- Security concerns

## Configuration

### Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Client Options

```typescript
const client = createClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 60000,
  defaultModel: 'claude-3-sonnet-20240229',
});
```

## Models

Supported Claude models:

| Model | Use Case | Cost |
|-------|----------|------|
| claude-3-opus-20240229 | Complex reasoning | $$$ |
| claude-3-sonnet-20240229 | Balanced | $$ |
| claude-3-haiku-20240307 | Fast, simple tasks | $ |

## Building

```bash
# Build package
pnpm --filter @mobigen/ai build

# Type checking
pnpm --filter @mobigen/ai typecheck

# Clean build artifacts
pnpm --filter @mobigen/ai clean
```

## Related Documentation

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Main README](../../README.md)
- [Architecture](../../docs/ARCHITECTURE.md)
