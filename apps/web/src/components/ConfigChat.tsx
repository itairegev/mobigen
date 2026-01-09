'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  getTemplateConfig,
  shouldShowStep,
  type TemplateConfig,
  type TemplateConfigStep,
  type ConfigField,
} from '@/lib/template-config';

interface Message {
  id: string;
  type: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[]; // Quick reply suggestions
}

interface ConfigChatProps {
  templateId: string;
  templateName: string;
  templateIcon: string;
  primaryColor: string;
  onComplete: (config: Record<string, string>) => void;
  onCancel: () => void;
}

export function ConfigChat({
  templateId,
  templateName,
  templateIcon,
  primaryColor,
  onComplete,
  onCancel,
}: ConfigChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = getTemplateConfig(templateId);
  const visibleSteps = config.steps.filter(step => shouldShowStep(step, values));
  const currentStep = visibleSteps[currentStepIndex];
  const isComplete = currentStepIndex >= visibleSteps.length;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after assistant message
  useEffect(() => {
    if (!isTyping && !isComplete) {
      inputRef.current?.focus();
    }
  }, [isTyping, isComplete]);

  // Add welcome message on mount
  useEffect(() => {
    const welcomeDelay = setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage('assistant', config.welcomeMessage);

        // Add first step message after a delay
        if (config.steps.length > 0) {
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              const firstStep = config.steps[0];
              const field = firstStep.fields[0];
              addMessage('assistant', firstStep.message, getSuggestionsForField(field));
            }, 800);
          }, 500);
        }
      }, 1000);
    }, 300);

    return () => clearTimeout(welcomeDelay);
  }, []);

  const addMessage = (type: Message['type'], content: string, suggestions?: string[]) => {
    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        type,
        content,
        timestamp: new Date(),
        suggestions,
      },
    ]);
  };

  // Get suggestions for different field types
  const getSuggestionsForField = (field: ConfigField): string[] | undefined => {
    if (field.type === 'boolean') {
      return ['Yes', 'No'];
    }
    if (field.type === 'select' && field.options) {
      return field.options.map(o => o.label);
    }
    return undefined;
  };

  const validateShopifyStore = async (domain: string): Promise<boolean> => {
    try {
      const cleanDomain = domain
        .replace('https://', '')
        .replace('http://', '')
        .replace('.myshopify.com', '')
        .replace(/\/$/, '');

      const response = await fetch(
        `https://${cleanDomain}.myshopify.com/products.json?limit=1`
      );

      return response.ok;
    } catch {
      return false;
    }
  };

  const validateField = async (field: ConfigField, value: string): Promise<string | null> => {
    // Handle empty value for required fields
    if (field.required && !value.trim()) {
      return `Please provide a ${field.label.toLowerCase()}.`;
    }

    // Skip validation for optional empty fields
    if (!field.required && !value.trim()) {
      return null;
    }

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `That seems too short. ${field.label} should be at least ${field.validation.minLength} characters.`;
    }

    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return `Hmm, that doesn't look quite right. Please check the format.`;
      }
    }

    if (field.validation?.validator === 'shopify_store') {
      setIsValidating(true);
      addMessage('assistant', "Let me verify that store exists...");
      const isValid = await validateShopifyStore(value);
      setIsValidating(false);

      if (!isValid) {
        return "I couldn't find that Shopify store. Please double-check the store name and try again.";
      }
    }

    return null;
  };

  // Parse user input based on field type
  const parseUserInput = (field: ConfigField, input: string): string => {
    const normalizedInput = input.trim().toLowerCase();

    if (field.type === 'boolean') {
      // Accept various forms of yes/no
      if (['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 'true', '1'].includes(normalizedInput)) {
        return 'true';
      }
      if (['no', 'n', 'nope', 'nah', 'false', '0'].includes(normalizedInput)) {
        return 'false';
      }
      return input; // Let validation handle invalid input
    }

    if (field.type === 'select' && field.options) {
      // Try to match user input to an option
      const exactMatch = field.options.find(
        o => o.label.toLowerCase() === normalizedInput || o.value.toLowerCase() === normalizedInput
      );
      if (exactMatch) return exactMatch.value;

      // Partial match
      const partialMatch = field.options.find(
        o => o.label.toLowerCase().includes(normalizedInput) || normalizedInput.includes(o.label.toLowerCase())
      );
      if (partialMatch) return partialMatch.value;

      // Number selection (1, 2, 3...)
      const numIndex = parseInt(normalizedInput) - 1;
      if (!isNaN(numIndex) && numIndex >= 0 && numIndex < field.options.length) {
        return field.options[numIndex].value;
      }

      return input; // Let validation handle
    }

    return input.trim();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentStep || isValidating || !inputValue.trim()) return;

    const field = currentStep.fields[0];
    const userInput = inputValue.trim();

    // Add user message
    addMessage('user', userInput);
    setInputValue('');

    // Parse the input
    const parsedValue = parseUserInput(field, userInput);

    // Validate for select/boolean - check if valid option
    if (field.type === 'boolean' && !['true', 'false'].includes(parsedValue)) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('assistant', "I didn't quite catch that. Please reply with 'yes' or 'no'.", ['Yes', 'No']);
        }, 500);
      }, 300);
      return;
    }

    if (field.type === 'select' && field.options) {
      const isValidOption = field.options.some(o => o.value === parsedValue);
      if (!isValidOption) {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            const optionsList = field.options!.map((o, i) => `${i + 1}. ${o.label}`).join('\n');
            addMessage(
              'assistant',
              `Please choose one of these options:\n\n${optionsList}`,
              field.options!.map(o => o.label)
            );
          }, 500);
        }, 300);
        return;
      }
    }

    // Validate field
    const error = await validateField(field, parsedValue);
    if (error) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('assistant', error, getSuggestionsForField(field));
        }, 500);
      }, 300);
      return;
    }

    // Save value
    const newValues = { ...values, [field.id]: parsedValue };
    setValues(newValues);

    // Get friendly confirmation for the user
    const confirmationMessage = getConfirmationMessage(field, parsedValue, userInput);

    // Move to next step
    const nextStepIndex = currentStepIndex + 1;
    const nextVisibleSteps = config.steps.filter(step => shouldShowStep(step, newValues));

    if (nextStepIndex >= nextVisibleSteps.length) {
      // Complete!
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage('assistant', confirmationMessage ? `${confirmationMessage}\n\n${config.completionMessage}` : config.completionMessage);
          setTimeout(() => {
            onComplete(newValues);
          }, 1500);
        }, 800);
      }, 500);
    } else {
      // Next step
      setCurrentStepIndex(nextStepIndex);
      const nextStep = nextVisibleSteps[nextStepIndex];
      const nextField = nextStep.fields[0];
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const message = confirmationMessage
            ? `${confirmationMessage}\n\n${nextStep.message}`
            : nextStep.message;
          addMessage('assistant', message, getSuggestionsForField(nextField));
        }, 800);
      }, 500);
    }
  };

  // Generate a friendly confirmation based on field type
  const getConfirmationMessage = (field: ConfigField, value: string, originalInput: string): string => {
    if (field.type === 'boolean') {
      return value === 'true' ? "Great!" : "Got it!";
    }
    if (field.type === 'select' && field.options) {
      const option = field.options.find(o => o.value === value);
      if (option) return `${option.label} - nice choice!`;
    }
    if (field.validation?.validator === 'shopify_store') {
      return `Found your store! ✓`;
    }
    return "";
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const field = currentStep?.fields[0];
      if (field) {
        // Directly process the suggestion
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        setInputValue(suggestion);
        setTimeout(() => handleSubmit(fakeEvent), 50);
      }
    }, 100);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Get placeholder based on current field
  const getPlaceholder = (): string => {
    if (!currentStep) return 'Type your message...';
    const field = currentStep.fields[0];

    if (field.type === 'boolean') {
      return "Type 'yes' or 'no'...";
    }
    if (field.type === 'select') {
      return "Type your choice or select below...";
    }
    if (field.type === 'api_key') {
      return "Paste your API key here...";
    }
    return field.placeholder || `Type your ${field.label.toLowerCase()}...`;
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-[#0A0A0B] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{templateIcon}</span>
          <div>
            <h3 className="text-white font-semibold">Setting up {templateName}</h3>
            <p className="text-white/50 text-sm">
              Step {Math.min(currentStepIndex + 1, visibleSteps.length)} of {visibleSteps.length}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${((currentStepIndex + 1) / visibleSteps.length) * 100}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
          <div key={message.id}>
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'rounded-br-md'
                    : 'bg-white/10 rounded-bl-md'
                }`}
                style={{
                  backgroundColor: message.type === 'user' ? primaryColor : undefined,
                }}
              >
                <p className="text-white text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>

            {/* Suggestions (quick replies) */}
            {message.type === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 ml-1">
                {message.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isValidating || isTyping}
                    className="px-3 py-1.5 text-sm rounded-full border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/10">
        {isComplete ? (
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/60">Preparing your app...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type={currentStep?.fields[0]?.type === 'api_key' ? 'password' : 'text'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={isValidating || isTyping}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50"
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isValidating || isTyping}
              className="px-4 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {isValidating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
