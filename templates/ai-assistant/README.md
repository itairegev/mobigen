# AI Assistant Template

AI chat interface React Native template for Mobigen.

## Overview

The AI assistant template provides a complete chat interface for AI-powered conversations, including message history, conversation management, and settings.

## Features

- Chat interface with message bubbles
- Conversation history
- Multiple conversations
- Typing indicators
- Message streaming
- Code syntax highlighting
- Markdown rendering
- Voice input (optional)
- Image attachments
- Settings and preferences

## Structure

```
ai-assistant/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Current chat
│   │   ├── history.tsx      # Conversations
│   │   └── settings.tsx     # Settings
│   ├── chat/
│   │   └── [id].tsx         # Specific conversation
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── chat/
│   │   ├── ChatView.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── TypingIndicator.tsx
│   │   └── MessageList.tsx
│   ├── conversation/
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── NewChatButton.tsx
│   ├── content/
│   │   ├── MarkdownView.tsx
│   │   ├── CodeBlock.tsx
│   │   └── ImageAttachment.tsx
│   └── ui/
│       └── ...
├── hooks/
│   ├── useChat.ts
│   ├── useConversations.ts
│   ├── useStreaming.ts
│   └── useVoiceInput.ts
├── services/
│   ├── api.ts
│   ├── chat.ts
│   └── storage.ts
├── types/
│   ├── message.ts
│   └── conversation.ts
└── ...
```

## Screens

### Chat

- Message history
- Input field
- Send button
- Attachment options

### Conversation History

- List of conversations
- Search conversations
- Delete/archive
- Create new chat

### Settings

- API configuration
- Model selection
- Theme preferences
- Data management

## Data Types

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
}
```

### Conversation

```typescript
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model?: string;
}
```

### Attachment

```typescript
interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
}
```

## Hooks

### useChat

```typescript
const {
  messages,
  sendMessage,
  isLoading,
  error,
  retry,
  clear
} = useChat(conversationId);

// Send message
await sendMessage('Hello, how can you help me?');

// With attachments
await sendMessage('What is in this image?', {
  attachments: [imageFile]
});
```

### useStreaming

```typescript
const { stream, isStreaming, content } = useStreaming();

// Start streaming response
await stream({
  messages: conversationMessages,
  onToken: (token) => appendContent(token),
  onComplete: (fullResponse) => saveMessage(fullResponse),
});
```

### useConversations

```typescript
const {
  conversations,
  create,
  delete: deleteConversation,
  archive,
  search
} = useConversations();

// Create new conversation
const newChat = await create({ title: 'New Chat' });

// Search conversations
const results = await search('recipe');
```

## Components

### ChatView

```tsx
<ChatView
  conversationId={id}
  onSend={handleSend}
  onAttach={handleAttach}
  model={selectedModel}
/>
```

### MessageBubble

```tsx
<MessageBubble
  message={message}
  isUser={message.role === 'user'}
  showAvatar={true}
  onRetry={handleRetry}
/>
```

### MessageInput

```tsx
<MessageInput
  value={input}
  onChange={setInput}
  onSend={handleSend}
  onAttach={handleAttach}
  disabled={isLoading}
  placeholder="Type a message..."
/>
```

### CodeBlock

```tsx
<CodeBlock
  code={codeContent}
  language="typescript"
  showCopy={true}
/>
```

## AI Integration

### API Configuration

```typescript
// services/api.ts
const API_CONFIG = {
  baseUrl: 'https://api.anthropic.com',
  model: 'claude-3-sonnet-20240229',
  maxTokens: 4096,
};

export async function chat(messages: Message[]): Promise<Message> {
  const response = await fetch(`${API_CONFIG.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      model: API_CONFIG.model,
      max_tokens: API_CONFIG.maxTokens,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  return response.json();
}
```

### Streaming Support

```typescript
// services/chat.ts
export async function* streamChat(messages: Message[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, stream: true }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}
```

## Features

### Markdown Rendering

Messages support full Markdown:

- **Bold** and *italic* text
- `inline code` and code blocks
- Lists and tables
- Links and images

### Syntax Highlighting

Code blocks with language detection:

```tsx
<CodeBlock language="javascript">
  {`function hello() {
  console.log('Hello, world!');
}`}
</CodeBlock>
```

### Voice Input

Optional voice-to-text:

```typescript
const { startRecording, stopRecording, transcript } = useVoiceInput();

// Start recording
await startRecording();

// Stop and get transcript
const text = await stopRecording();
setInput(text);
```

## Customization

### Model Selection

Allow users to choose AI models:

```typescript
const models = [
  { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast' },
];
```

### System Prompts

Configure assistant behavior:

```typescript
const systemPrompt = `You are a helpful assistant.
Be concise and friendly in your responses.`;
```

## Use Cases

- Customer support bots
- Personal assistants
- Educational tutors
- Writing assistants
- Code helpers
- Creative tools

## Related Templates

- [base](../base/) - Minimal starter
- [news](../news/) - Content integration
