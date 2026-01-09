'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useGenerator } from '@/hooks/useGenerator';
import type { ValidationIssue } from '@/hooks/useGenerator';
import type { GenerationPhase, ProjectConfig } from '@/lib/types';

type Tab = 'progress' | 'chat' | 'files' | 'builds' | 'logs';

const GENERATOR_URL = process.env.NEXT_PUBLIC_GENERATOR_URL || 'http://localhost:4000';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

// Build status types
interface BuildArtifact {
  platform: 'ios' | 'android';
  status: 'pending' | 'building' | 'ready' | 'failed';
  downloadUrl?: string;
  errorMessage?: string;
  requiresAction?: string;
}

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('progress');
  const [hasStarted, setHasStarted] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQrCode, setPreviewQrCode] = useState<string | null>(null);
  const [buildArtifacts, setBuildArtifacts] = useState<BuildArtifact[]>([]);

  // Project info from URL params
  const projectName = searchParams.get('name') || 'My App';
  const template = searchParams.get('template') || 'base';
  const initialPrompt = searchParams.get('prompt') || '';
  const primaryColor = searchParams.get('primaryColor') || '#6366F1';
  const secondaryColor = searchParams.get('secondaryColor') || '#8B5CF6';
  const bundleId = searchParams.get('bundleId') || `com.mobigen.${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  // Template-specific config (e.g., Shopify domain, API keys) from ConfigChat
  const templateConfigParam = searchParams.get('config');
  const templateEnvVars = templateConfigParam
    ? JSON.parse(decodeURIComponent(templateConfigParam)) as Record<string, string>
    : {};

  const [activePrompt, setActivePrompt] = useState(initialPrompt);

  const {
    isConnected,
    isGenerating,
    isLoading,
    phases,
    filesGenerated,
    progress,
    result,
    error,
    jobId,
    jobStatus,
    canResume,
    failedTasks,
    jobHistory,
    // Logs for debugging
    logs,
    logErrors,
    logWarnings,
    validationResults,
    // Actions
    startGeneration,
    resumeGeneration,
    refreshProgress,
    fetchJobHistory,
    fetchFailedTasks,
    fetchLogs,
  } = useGenerator({ projectId, autoConnect: true });

  // Auto-start generation
  useEffect(() => {
    if (isLoading) return;
    if (hasStarted) return;
    if (isGenerating || result) return;
    if (jobId) {
      if (!hasStarted) setHasStarted(true);
      return;
    }
    if (!initialPrompt || !isConnected) return;

    const config: ProjectConfig = {
      appName: projectName,
      bundleId: { ios: bundleId, android: bundleId.replace(/\./g, '_') },
      branding: { displayName: projectName, primaryColor, secondaryColor },
      identifiers: {
        projectId,
        easProjectId: `eas-${projectId}`,
        awsResourcePrefix: `mobigen-${projectId.slice(0, 8)}`,
        analyticsKey: `analytics-${projectId}`,
      },
      // Template-specific environment variables (e.g., Shopify domain, API keys)
      envVars: templateEnvVars,
    };

    setHasStarted(true);
    setActivePrompt(initialPrompt);
    startGeneration(initialPrompt, config);
  }, [initialPrompt, isConnected, hasStarted, isGenerating, isLoading, result, jobId, projectId, projectName, bundleId, primaryColor, secondaryColor, templateEnvVars, startGeneration]);

  // Fetch build artifacts when generation is complete
  useEffect(() => {
    if (result?.success || jobStatus === 'completed') {
      fetchBuildArtifacts();
    }
  }, [result, jobStatus]);

  const fetchBuildArtifacts = async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/builds`);
      if (response.ok) {
        const data = await response.json();
        setBuildArtifacts(data.builds || []);
      }
    } catch (err) {
      console.error('Failed to fetch build artifacts:', err);
    }
  };

  const handleStartGeneration = () => {
    if (!promptInput.trim() || !isConnected || isGenerating) return;

    const config: ProjectConfig = {
      appName: projectName,
      bundleId: { ios: bundleId, android: bundleId.replace(/\./g, '_') },
      branding: { displayName: projectName, primaryColor, secondaryColor },
      identifiers: {
        projectId,
        easProjectId: `eas-${projectId}`,
        awsResourcePrefix: `mobigen-${projectId.slice(0, 8)}`,
        analyticsKey: `analytics-${projectId}`,
      },
      // Template-specific environment variables (e.g., Shopify domain, API keys)
      envVars: templateEnvVars,
    };

    setHasStarted(true);
    setActivePrompt(promptInput);
    startGeneration(promptInput, config);
  };

  const handlePreview = async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/preview`);
      const data = await response.json();
      setPreviewQrCode(data.qrCode || null);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Preview error:', err);
    }
  };

  const handleTriggerBuild = async (platform: 'ios' | 'android' | 'all') => {
    try {
      await fetch(`${GENERATOR_URL}/api/projects/${projectId}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      // Refresh build status
      setTimeout(fetchBuildArtifacts, 2000);
    } catch (err) {
      console.error('Build error:', err);
    }
  };

  const getStatusIcon = (status: GenerationPhase['status']) => {
    switch (status) {
      case 'completed': return <CheckIcon className="w-5 h-5 text-emerald-400" />;
      case 'running': return <SpinnerIcon className="w-5 h-5 text-amber-400 animate-spin" />;
      case 'error': return <XIcon className="w-5 h-5 text-red-400" />;
      default: return <CircleIcon className="w-5 h-5 text-white/20" />;
    }
  };

  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const generationComplete = completedPhases === phases.length && (result !== null || jobStatus === 'completed');
  const validationComplete = phases.find(p => p.id === 'validation')?.status === 'completed';
  const hasFailedBuild = buildArtifacts.some(b => b.status === 'failed');
  const hasReadyBuild = buildArtifacts.some(b => b.status === 'ready');

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 50%)` }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <h1 className="text-xl font-semibold text-white">{projectName}</h1>
                <p className="text-xs text-white/40 font-mono">{bundleId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>

              {/* Preview Button - Show when validation is complete */}
              {validationComplete && (
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              )}

              {/* Admin Link */}
              {generationComplete && (
                <a
                  href={`${ADMIN_URL}/projects/${projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Admin
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="relative z-10 border-b border-white/10 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                {phases.find(p => p.status === 'running')?.name || 'Generating...'}
              </span>
              <span className="text-sm text-white/60">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error/Action Required Banner */}
      {(error || hasFailedBuild) && (
        <div className="relative z-10 border-b border-red-500/30 bg-red-500/10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-red-400 font-medium">
                  {hasFailedBuild ? 'Build Failed - Action Required' : 'Generation Error'}
                </p>
                <p className="text-red-400/70 text-sm">
                  {error || buildArtifacts.find(b => b.status === 'failed')?.errorMessage}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {canResume && (
                <button
                  onClick={() => resumeGeneration()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Resume
                </button>
              )}
              {hasFailedBuild && (
                <button
                  onClick={() => handleTriggerBuild('all')}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Retry Build
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(['progress', 'chat', 'files', 'builds', 'logs'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'builds') {
                    fetchJobHistory();
                    fetchBuildArtifacts();
                  }
                  if (tab === 'logs') {
                    fetchLogs();
                  }
                }}
                className={`px-4 py-3 text-sm font-medium capitalize rounded-t-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {tab}
                {tab === 'files' && filesGenerated.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">
                    {filesGenerated.length}
                  </span>
                )}
                {tab === 'builds' && hasFailedBuild && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">!</span>
                )}
                {tab === 'logs' && logErrors.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
                    {logErrors.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phases */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white">Generation Progress</h2>
                </div>
                <div className="p-4 space-y-2">
                  {phases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                        phase.status === 'running' ? 'bg-amber-500/10 border border-amber-500/30' :
                        phase.status === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                        phase.status === 'completed' ? 'bg-emerald-500/5' :
                        'bg-white/5'
                      }`}
                    >
                      {getStatusIcon(phase.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{phase.name}</p>
                        {phase.message && (
                          <p className="text-sm text-white/50 truncate">{phase.message}</p>
                        )}
                      </div>
                      {phase.status === 'running' && (
                        <span className="text-xs text-amber-400 font-medium">Processing...</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Card */}
              {generationComplete && result?.success && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">App Generated Successfully!</h3>
                      <p className="text-emerald-400/70">Your app is ready for preview and build</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">{result.files?.length || filesGenerated.length}</p>
                      <p className="text-xs text-white/50">Files Generated</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">{result.qaReport?.overallScore || 100}%</p>
                      <p className="text-xs text-white/50">QA Score</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <p className="text-2xl font-bold text-white">{phases.length}</p>
                      <p className="text-xs text-white/50">Phases Complete</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              {generationComplete && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Quick Actions</h3>
                  <button
                    onClick={handlePreview}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Preview on Device
                  </button>
                  <button
                    onClick={() => handleTriggerBuild('all')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Build for Stores
                  </button>
                  <a
                    href={`${GENERATOR_URL}/api/projects/${projectId}/download`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-lg font-medium text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Source
                  </a>
                </div>
              )}

              {/* Build Artifacts */}
              {buildArtifacts.length > 0 && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Downloads</h3>
                  {buildArtifacts.map((artifact) => (
                    <div
                      key={artifact.platform}
                      className={`p-3 rounded-lg ${
                        artifact.status === 'ready' ? 'bg-emerald-500/10' :
                        artifact.status === 'failed' ? 'bg-red-500/10' :
                        artifact.status === 'building' ? 'bg-amber-500/10' :
                        'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{artifact.platform === 'ios' ? '🍎' : '🤖'}</span>
                          <span className="font-medium text-white capitalize">{artifact.platform}</span>
                        </div>
                        {artifact.status === 'ready' && artifact.downloadUrl ? (
                          <a
                            href={artifact.downloadUrl}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            Download {artifact.platform === 'ios' ? 'IPA' : 'APK'}
                          </a>
                        ) : artifact.status === 'building' ? (
                          <span className="text-xs text-amber-400">Building...</span>
                        ) : artifact.status === 'failed' ? (
                          <span className="text-xs text-red-400">Failed</span>
                        ) : null}
                      </div>
                      {artifact.requiresAction && (
                        <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded">
                          ⚠️ {artifact.requiresAction}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Prompt Card */}
              {!activePrompt && !hasStarted ? (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Describe Your App</h3>
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="What kind of app do you want to build?"
                    className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    disabled={!isConnected || isGenerating}
                  />
                  <button
                    onClick={handleStartGeneration}
                    disabled={!promptInput.trim() || !isConnected || isGenerating}
                    className="w-full py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    Generate App
                  </button>
                </div>
              ) : activePrompt && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Your Request</h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {decodeURIComponent(activePrompt)}
                  </p>
                </div>
              )}

              {/* Project Info */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Project Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Template</span>
                    <span className="text-white capitalize">{template}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Status</span>
                    <span className={`font-medium ${
                      generationComplete ? 'text-emerald-400' :
                      isGenerating ? 'text-amber-400' :
                      error ? 'text-red-400' :
                      'text-white/70'
                    }`}>
                      {generationComplete ? 'Complete' :
                       isGenerating ? 'Generating' :
                       error ? 'Error' :
                       'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Progress</span>
                    <span className="text-white">{completedPhases}/{phases.length} phases</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white/5 rounded-xl border border-white/10 h-[600px] flex flex-col overflow-hidden">
            <ChatInterface projectId={projectId} />
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Generated Files
                <span className="ml-2 text-sm text-white/50">({filesGenerated.length})</span>
              </h2>
              {generationComplete && (
                <a
                  href={`${GENERATOR_URL}/api/projects/${projectId}/download`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm font-medium text-white transition-colors"
                >
                  Download All
                </a>
              )}
            </div>
            <div className="p-4">
              {filesGenerated.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-white/50">No files generated yet</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filesGenerated.filter(f => !f.startsWith('generated-file')).map((file) => (
                    <div key={file} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <span className="text-lg">
                        {file.endsWith('.tsx') || file.endsWith('.ts') ? '📄' :
                         file.endsWith('.json') ? '📋' :
                         file.endsWith('.css') ? '🎨' : '📁'}
                      </span>
                      <span className="font-mono text-sm text-white/70 truncate">{file}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Builds Tab */}
        {activeTab === 'builds' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Build Status */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Build Status</h2>
                <button
                  onClick={() => handleTriggerBuild('all')}
                  disabled={!generationComplete}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded text-sm font-medium text-white transition-colors"
                >
                  New Build
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* iOS Build */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🍎</span>
                      <span className="font-medium text-white">iOS Build</span>
                    </div>
                    {buildArtifacts.find(b => b.platform === 'ios')?.status === 'ready' && (
                      <a
                        href={buildArtifacts.find(b => b.platform === 'ios')?.downloadUrl}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium"
                      >
                        Download IPA
                      </a>
                    )}
                  </div>
                  <BuildStatusIndicator
                    artifact={buildArtifacts.find(b => b.platform === 'ios')}
                    onRetry={() => handleTriggerBuild('ios')}
                  />
                </div>

                {/* Android Build */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🤖</span>
                      <span className="font-medium text-white">Android Build</span>
                    </div>
                    {buildArtifacts.find(b => b.platform === 'android')?.status === 'ready' && (
                      <a
                        href={buildArtifacts.find(b => b.platform === 'android')?.downloadUrl}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium"
                      >
                        Download APK
                      </a>
                    )}
                  </div>
                  <BuildStatusIndicator
                    artifact={buildArtifacts.find(b => b.platform === 'android')}
                    onRetry={() => handleTriggerBuild('android')}
                  />
                </div>
              </div>
            </div>

            {/* Job History */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Generation History</h2>
                <button onClick={fetchJobHistory} className="text-sm text-white/50 hover:text-white">
                  Refresh
                </button>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {jobHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/50">No generation history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {jobHistory.map((job) => (
                      <div
                        key={job.id}
                        className={`p-3 rounded-lg ${
                          job.status === 'completed' ? 'bg-emerald-500/10' :
                          job.status === 'failed' ? 'bg-red-500/10' :
                          job.status === 'running' ? 'bg-amber-500/10' :
                          'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${
                            job.status === 'completed' ? 'text-emerald-400' :
                            job.status === 'failed' ? 'text-red-400' :
                            job.status === 'running' ? 'text-amber-400' :
                            'text-white/70'
                          }`}>
                            {job.status === 'completed' ? '✓ Completed' :
                             job.status === 'failed' ? '✗ Failed' :
                             job.status === 'running' ? '⏳ Running' :
                             '○ ' + job.status}
                          </span>
                          <span className="text-xs text-white/40">
                            {new Date(job.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-white/50">
                          {job.completedTasks}/{job.totalTasks} tasks • {job.progress}% complete
                        </div>
                        {job.status === 'failed' && job.errorMessage && (
                          <p className="mt-2 text-xs text-red-400">{job.errorMessage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Generation Logs</h2>
                <p className="text-sm text-white/50">Debug information from the generation process</p>
              </div>
              <button
                onClick={() => fetchLogs()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm font-medium text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Validation Results */}
            {validationResults && (
              <div className={`rounded-xl border overflow-hidden ${
                validationResults.passed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {validationResults.passed ? (
                      <CheckIcon className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XIcon className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">
                        Validation {validationResults.passed ? 'Passed' : 'Failed'}
                      </h3>
                      <p className="text-sm text-white/50">
                        Tier: {validationResults.tier} •
                        {validationResults.errors?.length || 0} errors,
                        {validationResults.warnings?.length || 0} warnings
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationResults.errors && validationResults.errors.length > 0 && (
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-medium text-red-400 mb-3">Validation Errors</h4>
                    {validationResults.errors.map((err: ValidationIssue, idx: number) => (
                      <div key={idx} className="p-3 bg-red-500/10 rounded-lg">
                        {err.file && (
                          <p className="text-xs font-mono text-white/60 mb-1">
                            {err.file}{err.line ? `:${err.line}` : ''}
                          </p>
                        )}
                        <p className="text-sm text-red-400">{err.message}</p>
                        {err.code && (
                          <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-white/70 overflow-x-auto">
                            {err.code}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Logs Section */}
            {logErrors.length > 0 && (
              <div className="bg-red-500/10 rounded-xl border border-red-500/30 overflow-hidden">
                <div className="p-4 border-b border-red-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XIcon className="w-5 h-5 text-red-400" />
                    <h3 className="font-semibold text-red-400">Errors ({logErrors.length})</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {logErrors.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-red-500/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-red-400 uppercase">
                          {entry.phase || 'Unknown Phase'}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-red-300 font-mono whitespace-pre-wrap break-all">
                        {entry.message}
                      </p>
                      {entry.data !== undefined && entry.data !== null && (
                        <details className="mt-2">
                          <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-white/60 overflow-x-auto">
                            {typeof entry.data === 'string' ? String(entry.data) : JSON.stringify(entry.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Logs Section */}
            {logWarnings.length > 0 && (
              <div className="bg-amber-500/10 rounded-xl border border-amber-500/30 overflow-hidden">
                <div className="p-4 border-b border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="font-semibold text-amber-400">Warnings ({logWarnings.length})</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {logWarnings.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-400 uppercase">
                          {entry.phase || 'Unknown Phase'}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-amber-300 font-mono whitespace-pre-wrap break-all">
                        {entry.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Logs Section */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white">All Logs ({logs.length})</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLogs('error')}
                    className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    Errors Only
                  </button>
                  <button
                    onClick={() => fetchLogs('warn')}
                    className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                  >
                    Warnings
                  </button>
                  <button
                    onClick={() => fetchLogs()}
                    className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20"
                  >
                    All
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📋</div>
                    <p className="text-white/50">No logs available</p>
                    <p className="text-sm text-white/30 mt-1">
                      Logs are generated during the app generation process
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded ${
                          entry.level === 'error' ? 'bg-red-500/10 text-red-400' :
                          entry.level === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                          entry.level === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                          entry.level === 'phase' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-white/5 text-white/70'
                        }`}
                      >
                        <span className="text-white/40 mr-2">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`uppercase mr-2 ${
                          entry.level === 'error' ? 'text-red-400' :
                          entry.level === 'warn' ? 'text-amber-400' :
                          entry.level === 'success' ? 'text-emerald-400' :
                          entry.level === 'phase' ? 'text-indigo-400' :
                          'text-white/40'
                        }`}>
                          [{entry.level}]
                        </span>
                        {entry.phase && (
                          <span className="text-white/50 mr-2">[{entry.phase}]</span>
                        )}
                        <span className="whitespace-pre-wrap break-all">{entry.message}</span>
                        {entry.duration && (
                          <span className="text-white/30 ml-2">({entry.duration}ms)</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* No Logs Message when everything is empty */}
            {logs.length === 0 && logErrors.length === 0 && logWarnings.length === 0 && !validationResults && (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-white/50">No logs available yet</p>
                <p className="text-sm text-white/30 mt-1">
                  Start a generation to see logs here
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1B] rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Preview on Device</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-white/50 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {previewQrCode ? (
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-xl mb-4">
                    <img src={previewQrCode} alt="Preview QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-white/70 text-sm text-center">
                    Scan with Expo Go app on your device
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/50 mb-4">Preview requires Expo Go app</p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href="https://apps.apple.com/app/expo-go/id982107779"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white"
                    >
                      iOS App Store
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white"
                    >
                      Google Play
                    </a>
                  </div>
                </div>
              )}
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-xs text-white/50 mb-2">Manual connection:</p>
                <code className="text-xs text-white/70 font-mono">
                  exp://{GENERATOR_URL.replace('http://', '').replace('https://', '')}/--/projects/{projectId}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Build Status Component
function BuildStatusIndicator({ artifact, onRetry }: { artifact?: BuildArtifact; onRetry: () => void }) {
  if (!artifact) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">Not built yet</span>
        <button onClick={onRetry} className="text-xs text-white/50 hover:text-white">
          Start Build
        </button>
      </div>
    );
  }

  if (artifact.status === 'building') {
    return (
      <div className="flex items-center gap-2 text-amber-400">
        <SpinnerIcon className="w-4 h-4 animate-spin" />
        <span className="text-sm">Building...</span>
      </div>
    );
  }

  if (artifact.status === 'failed') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-400">
          <XIcon className="w-4 h-4" />
          <span className="text-sm">Build failed</span>
        </div>
        {artifact.errorMessage && (
          <p className="text-xs text-red-400/70">{artifact.errorMessage}</p>
        )}
        {artifact.requiresAction && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
            <strong>Action Required:</strong> {artifact.requiresAction}
          </div>
        )}
        <button
          onClick={onRetry}
          className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-medium"
        >
          Retry Build
        </button>
      </div>
    );
  }

  if (artifact.status === 'ready') {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <CheckIcon className="w-4 h-4" />
        <span className="text-sm">Ready for download</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-white/50">
      <CircleIcon className="w-4 h-4" />
      <span className="text-sm">Pending</span>
    </div>
  );
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
    </svg>
  );
}
