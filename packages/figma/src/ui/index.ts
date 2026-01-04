/**
 * Figma Import UI
 * React components and hooks for Figma import wizard
 */

import { useState, useCallback, useEffect } from 'react';
import { FigmaUrlParser } from '../parser';
import type { DesignTokens, ConvertedComponent, FigmaImportResult } from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ImportStep = 'url' | 'frames' | 'tokens' | 'importing' | 'complete';

export interface ImportWizardProps {
  onComplete: (result: FigmaImportResult) => void;
  onCancel?: () => void;
  initialUrl?: string;
  projectId?: string;
}

export interface FrameInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnailUrl?: string;
  isMobileSize: boolean;
  aspectRatio: number;
}

export interface ImportProgress {
  stage: 'fetching' | 'extracting' | 'generating' | 'validating' | 'complete';
  percentage: number;
  currentItem?: string;
  totalItems?: number;
  processedItems?: number;
  error?: string;
}

export interface UrlValidationResult {
  isValid: boolean;
  fileKey?: string;
  nodeId?: string;
  error?: string;
}

export interface ImportWizardState {
  currentStep: ImportStep;
  figmaUrl: string;
  urlValidation?: UrlValidationResult;
  availableFrames: FrameInfo[];
  selectedFrameIds: string[];
  tokens?: DesignTokens;
  progress?: ImportProgress;
  result?: FigmaImportResult;
  error?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Main hook for managing Figma import workflow
 */
export function useFigmaImport() {
  const [state, setState] = useState<ImportWizardState>({
    currentStep: 'url',
    figmaUrl: '',
    availableFrames: [],
    selectedFrameIds: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate Figma URL
   */
  const validateUrl = useCallback((url: string): UrlValidationResult => {
    const result = FigmaUrlParser.parse(url);
    if (!result.isValid) {
      return { isValid: false, error: result.error };
    }
    return { isValid: true, fileKey: result.fileKey, nodeId: result.nodeId };
  }, []);

  /**
   * Set Figma URL and validate
   */
  const setFigmaUrl = useCallback((url: string) => {
    const validation = validateUrl(url);
    setState(prev => ({ ...prev, figmaUrl: url, urlValidation: validation }));
  }, [validateUrl]);

  /**
   * Toggle frame selection
   */
  const toggleFrame = useCallback((frameId: string) => {
    setState(prev => ({
      ...prev,
      selectedFrameIds: prev.selectedFrameIds.includes(frameId)
        ? prev.selectedFrameIds.filter(id => id !== frameId)
        : [...prev.selectedFrameIds, frameId],
    }));
  }, []);

  /**
   * Select all mobile frames
   */
  const selectMobileFrames = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedFrameIds: prev.availableFrames.filter(f => f.isMobileSize).map(f => f.id),
    }));
  }, []);

  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    setState(prev => {
      const steps: ImportStep[] = ['url', 'frames', 'tokens', 'importing', 'complete'];
      const currentIndex = steps.indexOf(prev.currentStep);
      if (currentIndex < steps.length - 1) {
        return { ...prev, currentStep: steps[currentIndex + 1] };
      }
      return prev;
    });
  }, []);

  /**
   * Go to previous step
   */
  const goBack = useCallback(() => {
    setState(prev => {
      const steps: ImportStep[] = ['url', 'frames', 'tokens', 'importing', 'complete'];
      const currentIndex = steps.indexOf(prev.currentStep);
      if (currentIndex > 0) {
        return { ...prev, currentStep: steps[currentIndex - 1] };
      }
      return prev;
    });
  }, []);

  /**
   * Complete the import
   */
  const completeImport = useCallback((result: FigmaImportResult) => {
    setState(prev => ({
      ...prev,
      currentStep: 'complete',
      result,
      progress: { stage: 'complete', percentage: 100 },
    }));
  }, []);

  /**
   * Reset wizard
   */
  const reset = useCallback(() => {
    setState({
      currentStep: 'url',
      figmaUrl: '',
      availableFrames: [],
      selectedFrameIds: [],
    });
  }, []);

  return {
    state,
    isLoading,
    setFigmaUrl,
    validateUrl,
    toggleFrame,
    selectMobileFrames,
    nextStep,
    goBack,
    completeImport,
    reset,
  };
}

/**
 * Hook for tracking import progress
 */
export function useImportProgress() {
  const [progress, setProgress] = useState<ImportProgress>({
    stage: 'fetching',
    percentage: 0,
  });

  const updateProgress = useCallback((update: Partial<ImportProgress>) => {
    setProgress(prev => ({ ...prev, ...update }));
  }, []);

  const start = useCallback(() => {
    setProgress({ stage: 'fetching', percentage: 0 });
  }, []);

  const complete = useCallback(() => {
    setProgress({ stage: 'complete', percentage: 100 });
  }, []);

  const setError = useCallback((error: string) => {
    setProgress(prev => ({ ...prev, error }));
  }, []);

  return { progress, updateProgress, start, complete, setError };
}

/**
 * Hook for Figma OAuth
 */
export function useFigmaAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token
    const token = typeof window !== 'undefined' ? localStorage.getItem('figma_token') : null;
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const startAuth = useCallback(() => {
    const clientId = process.env.FIGMA_CLIENT_ID;
    const redirectUri = process.env.FIGMA_REDIRECT_URI;
    const authUrl = `https://www.figma.com/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=file_read&response_type=code`;
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  }, []);

  const signOut = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('figma_token');
    }
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, accessToken, startAuth, signOut };
}

export default { useFigmaImport, useImportProgress, useFigmaAuth };
