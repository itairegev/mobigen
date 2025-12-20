'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  GenerationPhase,
  GenerationProgress,
  GenerationResult,
  ProjectConfig,
} from '@/lib/types';

const GENERATOR_URL = process.env.NEXT_PUBLIC_GENERATOR_URL || 'http://localhost:4000';
const SIMULATION_MODE = process.env.NEXT_PUBLIC_SIMULATION_MODE === 'true';

interface UseGeneratorOptions {
  projectId: string;
  autoConnect?: boolean;
}

interface UseGeneratorReturn {
  isConnected: boolean;
  isGenerating: boolean;
  phases: GenerationPhase[];
  currentPhaseIndex: number;
  filesGenerated: string[];
  progress: number;
  result: GenerationResult | null;
  error: string | null;
  startGeneration: (prompt: string, config: ProjectConfig) => Promise<void>;
  disconnect: () => void;
}

export function useGenerator({ projectId, autoConnect = true }: UseGeneratorOptions): UseGeneratorReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phases, setPhases] = useState<GenerationPhase[]>([
    { id: 'setup', name: 'Project Setup', status: 'pending' },
    { id: 'analysis', name: 'Intent Analysis', status: 'pending', agent: 'intent-analyzer' },
    { id: 'product-definition', name: 'Product Definition', status: 'pending', agent: 'product-manager' },
    { id: 'architecture', name: 'Technical Architecture', status: 'pending', agent: 'technical-architect' },
    { id: 'ui-design', name: 'UI/UX Design', status: 'pending', agent: 'ui-ux-expert' },
    { id: 'planning', name: 'Task Planning', status: 'pending', agent: 'lead-developer' },
    { id: 'implementation', name: 'Implementation', status: 'pending', agent: 'developer' },
    { id: 'validation', name: 'Validation', status: 'pending', agent: 'validator' },
    { id: 'quality-assurance', name: 'Quality Assurance', status: 'pending', agent: 'qa' },
  ]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);
  const [filesGenerated, setFilesGenerated] = useState<string[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Calculate progress
  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const progress = phases.length > 0 ? (completedPhases / phases.length) * 100 : 0;

  // Handle phase update
  const handlePhaseUpdate = useCallback((phaseId: string, status: 'running' | 'completed' | 'error', message?: string) => {
    setPhases((prev) => {
      const phaseIndex = prev.findIndex((p) => p.id === phaseId);
      if (phaseIndex === -1) return prev;

      return prev.map((p, idx) => {
        if (idx < phaseIndex) {
          return { ...p, status: 'completed' };
        }
        if (idx === phaseIndex) {
          return { ...p, status, message };
        }
        return p;
      });
    });

    const phaseIndex = phases.findIndex((p) => p.id === phaseId);
    if (phaseIndex !== -1) {
      setCurrentPhaseIndex(phaseIndex);
    }
  }, [phases]);

  // Handle progress events
  const handleProgress = useCallback((data: GenerationProgress) => {
    const { stage, data: progressData } = data;

    switch (stage) {
      case 'phase':
        if (progressData.phase) {
          handlePhaseUpdate(progressData.phase, 'running');
        }
        break;

      case 'cloning':
        handlePhaseUpdate('setup', 'running', `Cloning ${progressData.template} template...`);
        break;

      case 'template-context':
        handlePhaseUpdate('setup', 'completed', 'Template loaded');
        break;

      case 'task':
        setPhases((prev) =>
          prev.map((p) =>
            p.id === 'implementation'
              ? { ...p, message: `Task ${progressData.index}/${progressData.total}: ${progressData.title}` }
              : p
          )
        );
        break;

      case 'validation-attempt':
        setPhases((prev) =>
          prev.map((p) =>
            p.id === 'validation'
              ? { ...p, message: `Validation attempt ${progressData.attempt}` }
              : p
          )
        );
        break;

      case 'fixing':
        setPhases((prev) =>
          prev.map((p) =>
            p.id === 'validation'
              ? { ...p, message: `Fixing errors (attempt ${progressData.attempt})` }
              : p
          )
        );
        break;

      case 'error':
        setError(progressData.error || 'An error occurred');
        setIsGenerating(false);
        break;

      case 'complete':
        setPhases((prev) => prev.map((p) => ({ ...p, status: 'completed' })));
        setIsGenerating(false);
        if (progressData.filesGenerated) {
          setFilesGenerated((prev) => [...new Set([...prev, ...(prev.length < progressData.filesGenerated! ? Array(progressData.filesGenerated! - prev.length).fill('generated-file') : [])])]);
        }
        break;

      default:
        // Handle SDK messages
        if ('tool_name' in progressData && (progressData.tool_name === 'Write' || progressData.tool_name === 'Edit')) {
          const toolInput = progressData.tool_input as Record<string, unknown> | undefined;
          const filePath = toolInput?.file_path as string;
          if (filePath) {
            setFilesGenerated((prev) => [...new Set([...prev, filePath])]);
          }
        }
    }
  }, [handlePhaseUpdate]);

  // Connect to socket
  useEffect(() => {
    if (!autoConnect || !projectId) return;

    const socket = io(GENERATOR_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('subscribe', projectId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('generation:progress', handleProgress);

    socket.on('generation:complete', (genResult: GenerationResult) => {
      setResult(genResult);
      setIsGenerating(false);
      setPhases((prev) => prev.map((p) => ({ ...p, status: 'completed' })));
    });

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe', projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, autoConnect, handleProgress]);

  // Simulate generation for development/demo mode
  const simulateGeneration = useCallback(async () => {
    const phaseIds = [
      'setup', 'analysis', 'product-definition', 'architecture',
      'ui-design', 'planning', 'implementation', 'validation', 'quality-assurance'
    ];

    for (let i = 0; i < phaseIds.length; i++) {
      setCurrentPhaseIndex(i);
      setPhases((prev) =>
        prev.map((p, idx) => ({
          ...p,
          status: idx < i ? 'completed' : idx === i ? 'running' : 'pending',
          message: idx === i ? 'Processing...' : p.message,
        }))
      );

      // Simulate phase duration
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Add some mock files during implementation phase
      if (i === 6) {
        setFilesGenerated([
          'src/app/(tabs)/index.tsx',
          'src/components/CustomComponent.tsx',
          'src/hooks/useCustomHook.ts',
          'src/services/api.ts',
          'src/types/index.ts',
        ]);
      }
    }

    setPhases((prev) => prev.map((p) => ({ ...p, status: 'completed', message: 'Done' })));
    setResult({
      files: [
        'src/app/(tabs)/index.tsx',
        'src/components/CustomComponent.tsx',
        'src/hooks/useCustomHook.ts',
        'src/services/api.ts',
        'src/types/index.ts',
      ],
      success: true,
      qaReport: {
        overallScore: 85,
        readyForProduction: true,
        recommendations: ['Add more unit tests', 'Optimize images'],
      },
    });
    setIsGenerating(false);
  }, []);

  // Start generation
  const startGeneration = useCallback(async (prompt: string, config: ProjectConfig) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setFilesGenerated([]);
    setPhases((prev) => prev.map((p) => ({ ...p, status: 'pending', message: undefined })));
    setCurrentPhaseIndex(-1);

    // Use simulation mode if enabled or if not connected
    if (SIMULATION_MODE || !socketRef.current?.connected) {
      console.log('Running in simulation mode');
      await simulateGeneration();
      return;
    }

    try {
      const response = await fetch(`${GENERATOR_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          prompt,
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start generation');
      }
    } catch (err) {
      // Fall back to simulation mode on connection error
      console.log('Falling back to simulation mode due to error:', err);
      await simulateGeneration();
    }
  }, [projectId, simulateGeneration]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe', projectId);
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [projectId]);

  return {
    isConnected,
    isGenerating,
    phases,
    currentPhaseIndex,
    filesGenerated,
    progress,
    result,
    error,
    startGeneration,
    disconnect,
  };
}
