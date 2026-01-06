'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useGenerator } from '@/hooks/useGenerator';
import type { GenerationPhase, ProjectConfig } from '@/lib/types';

type Tab = 'progress' | 'chat' | 'files' | 'preview' | 'history';

const GENERATOR_URL = process.env.NEXT_PUBLIC_GENERATOR_URL || 'http://localhost:4000';

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('progress');
  const [hasStarted, setHasStarted] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [buildInstructions, setBuildInstructions] = useState<Record<string, unknown> | null>(null);
  const [previewInstructions, setPreviewInstructions] = useState<Record<string, unknown> | null>(null);

  // Project info from URL params (in real app, fetch from API)
  const projectName = searchParams.get('name') || 'My App';
  const template = searchParams.get('template') || 'base';
  const initialPrompt = searchParams.get('prompt') || '';
  const primaryColor = searchParams.get('primaryColor') || '#3b82f6';
  const secondaryColor = searchParams.get('secondaryColor') || '#10b981';
  const bundleId = searchParams.get('bundleId') || `com.app.${projectName.toLowerCase().replace(/\s+/g, '')}`;

  // Track the actual prompt being used (either from URL or from input)
  const [activePrompt, setActivePrompt] = useState(initialPrompt);

  // Use the real generator hook
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
    startGeneration,
    resumeGeneration,
    refreshProgress,
    fetchJobHistory,
    fetchFailedTasks,
  } = useGenerator({ projectId, autoConnect: true });

  // Start generation when we have a prompt from URL and connection
  // IMPORTANT: Wait for isLoading to be false to check if a job already exists
  useEffect(() => {
    // Don't start until we've loaded existing job state
    if (isLoading) return;

    // Don't start if we've already started in this session
    if (hasStarted) return;

    // Don't start if already generating or have a result
    if (isGenerating || result) return;

    // Don't start if there's already an existing job for this project
    // (prevents restart when navigating back to the page)
    if (jobId) {
      console.log('[ProjectPage] Existing job found, not starting new generation:', jobId);
      // Mark as started to prevent any future re-triggers
      if (!hasStarted) {
        setHasStarted(true);
      }
      return;
    }

    // Don't start without a prompt or connection
    if (!initialPrompt || !isConnected) return;

    const config: ProjectConfig = {
      appName: projectName,
      bundleId: {
        ios: bundleId,
        android: bundleId.replace(/\./g, '_'),
      },
      branding: {
        displayName: projectName,
        primaryColor,
        secondaryColor,
      },
      identifiers: {
        projectId,
        easProjectId: `eas-${projectId}`,
        awsResourcePrefix: `mobigen-${projectId.slice(0, 8)}`,
        analyticsKey: `analytics-${projectId}`,
      },
    };

    console.log('[ProjectPage] Starting new generation for project:', projectId);
    setHasStarted(true);
    setActivePrompt(initialPrompt);
    startGeneration(initialPrompt, config);
  }, [initialPrompt, isConnected, hasStarted, isGenerating, isLoading, result, jobId, projectId, projectName, bundleId, primaryColor, secondaryColor, startGeneration]);

  // Handler for manual prompt submission
  const handleStartGeneration = () => {
    if (!promptInput.trim() || !isConnected || isGenerating) return;

    const config: ProjectConfig = {
      appName: projectName,
      bundleId: {
        ios: bundleId,
        android: bundleId.replace(/\./g, '_'),
      },
      branding: {
        displayName: projectName,
        primaryColor,
        secondaryColor,
      },
      identifiers: {
        projectId,
        easProjectId: `eas-${projectId}`,
        awsResourcePrefix: `mobigen-${projectId.slice(0, 8)}`,
        analyticsKey: `analytics-${projectId}`,
      },
    };

    setHasStarted(true);
    setActivePrompt(promptInput);
    startGeneration(promptInput, config);
  };

  const getStatusIcon = (status: GenerationPhase['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'running':
        return '⏳';
      case 'error':
        return '✗';
      default:
        return '○';
    }
  };

  const getStatusColor = (status: GenerationPhase['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'running':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const generationComplete = completedPhases === phases.length && result !== null;

  // Handler for download button
  const handleDownload = () => {
    window.open(`${GENERATOR_URL}/api/projects/${projectId}/download`, '_blank');
  };

  // Handler for build button
  const handleBuild = async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'all' }),
      });
      const data = await response.json();
      setBuildInstructions(data);
      setShowBuildModal(true);
    } catch (error) {
      console.error('Build error:', error);
      alert('Failed to get build instructions');
    }
  };

  // Handler for preview button
  const handlePreview = async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/preview`);
      const data = await response.json();
      setPreviewInstructions(data);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to get preview instructions');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                ← Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {projectName}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Template: {template} • ID: {projectId}
                  {!isConnected && <span className="ml-2 text-yellow-500">(Connecting...)</span>}
                  {error && <span className="ml-2 text-red-500">(Error)</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/projects/${projectId}/settings`}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Integrations
              </Link>
              {generationComplete && (
                <>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Download
                  </button>
                  <button
                    onClick={handleBuild}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
                  >
                    Build App
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Generating your app...
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-6 py-3">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
              <div className="ml-auto flex gap-2">
                {canResume && (
                  <button
                    onClick={() => resumeGeneration()}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={() => {
                    setHasStarted(false);
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Start Over
                </button>
              </div>
            </div>
            {failedTasks.length > 0 && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                {failedTasks.length} failed task(s).
                <button
                  onClick={() => setActiveTab('history')}
                  className="underline ml-1 hover:text-red-800"
                >
                  View details
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            {(['progress', 'chat', 'files', 'preview', 'history'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'history') {
                    fetchJobHistory();
                    fetchFailedTasks();
                  }
                }}
                className={`py-4 border-b-2 font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {tab}
                {tab === 'files' && filesGenerated.length > 0 && (
                  <span className="ml-1 text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {filesGenerated.length}
                  </span>
                )}
                {tab === 'history' && failedTasks.length > 0 && (
                  <span className="ml-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">
                    {failedTasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Phases List */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Generation Progress
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {phases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        phase.status === 'running'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                          : phase.status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-slate-50 dark:bg-slate-900'
                      }`}
                    >
                      <div
                        className={`text-xl font-bold ${getStatusColor(phase.status)}`}
                      >
                        {getStatusIcon(phase.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {phase.name}
                        </p>
                        {phase.agent && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Agent: {phase.agent}
                          </p>
                        )}
                        {phase.message && (
                          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                            {phase.message}
                          </p>
                        )}
                      </div>
                      {phase.status === 'running' && (
                        <div className="animate-pulse text-sm text-yellow-600 dark:text-yellow-400">
                          Processing...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Result Summary */}
              {result && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Generation Result
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                        {result.success ? '✓' : '✗'}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {result.success ? 'Generation Successful' : 'Generation completed with issues'}
                      </span>
                    </div>
                    {result.qaReport && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm text-slate-600 dark:text-slate-400">QA Score</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {result.qaReport.overallScore}%
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Files Generated</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {result.files.length}
                          </p>
                        </div>
                      </div>
                    )}
                    {result.requiresReview && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-yellow-700 dark:text-yellow-400">
                          This project requires human review before production deployment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Connection</span>
                    <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Template</span>
                    <span className="font-medium text-slate-900 dark:text-white">{template}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Phases</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {completedPhases}/{phases.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Files</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {filesGenerated.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prompt Card - show input if no prompt, otherwise show the prompt */}
              {!activePrompt && !hasStarted ? (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Describe Your App</h3>
                  <textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Describe the app you want to build...

Example: Create a coffee shop loyalty app with rewards points, QR code scanning for purchases, and a list of menu items."
                    className="w-full h-40 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!isConnected || isGenerating}
                  />
                  <button
                    onClick={handleStartGeneration}
                    disabled={!promptInput.trim() || !isConnected || isGenerating}
                    className="w-full mt-4 px-4 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {!isConnected ? 'Connecting...' : isGenerating ? 'Generating...' : 'Generate App'}
                  </button>
                  {!isConnected && (
                    <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                      Connecting to generator service...
                    </p>
                  )}
                </div>
              ) : activePrompt && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Your Request</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {decodeURIComponent(activePrompt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm h-[600px] flex flex-col">
            <ChatInterface projectId={projectId} />
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Generated Files ({filesGenerated.length})
              </h2>
            </div>
            <div className="p-6">
              {filesGenerated.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                  No files generated yet. Wait for the implementation phase to complete.
                </p>
              ) : (
                <div className="space-y-2">
                  {filesGenerated
                    .filter((file) => !file.startsWith('generated-file'))
                    .map((file) => (
                      <div
                        key={file}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                      >
                        <span className="text-lg">
                          {file.endsWith('.tsx') || file.endsWith('.ts')
                            ? '📄'
                            : file.endsWith('.json')
                            ? '📋'
                            : file.endsWith('.css')
                            ? '🎨'
                            : '📁'}
                        </span>
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">
                          {file}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                App Preview
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {generationComplete
                  ? 'Your app is ready! Build it to see the preview.'
                  : 'Preview will be available after generation completes.'}
              </p>
              {generationComplete && (
                <button
                  onClick={handlePreview}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600"
                >
                  Launch Preview
                </button>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job History */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Job History
                </h2>
                <button
                  onClick={fetchJobHistory}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Refresh
                </button>
              </div>
              <div className="p-6">
                {jobHistory.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                    No generation jobs yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {jobHistory.map((job) => (
                      <div
                        key={job.id}
                        className={`p-4 rounded-lg border ${
                          job.status === 'completed'
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                            : job.status === 'failed'
                            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                            : job.status === 'running'
                            ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-medium ${
                            job.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                            job.status === 'failed' ? 'text-red-700 dark:text-red-400' :
                            job.status === 'running' ? 'text-yellow-700 dark:text-yellow-400' :
                            'text-slate-700 dark:text-slate-300'
                          }`}>
                            {job.status === 'completed' ? '✓ Completed' :
                             job.status === 'failed' ? '✗ Failed' :
                             job.status === 'running' ? '⏳ Running' :
                             job.status === 'paused' ? '⏸ Paused' : '○ Pending'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(job.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>Progress:</span>
                            <span className="font-mono">{job.progress}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tasks:</span>
                            <span className="font-mono">
                              {job.completedTasks}/{job.totalTasks}
                              {job.failedTasks > 0 && (
                                <span className="text-red-500 ml-1">({job.failedTasks} failed)</span>
                              )}
                            </span>
                          </div>
                          {job.currentPhase && (
                            <div className="flex justify-between">
                              <span>Last Phase:</span>
                              <span className="font-mono">{job.currentPhase}</span>
                            </div>
                          )}
                          {job.retryCount > 0 && (
                            <div className="flex justify-between">
                              <span>Retries:</span>
                              <span className="font-mono">{job.retryCount}</span>
                            </div>
                          )}
                        </div>
                        {job.errorMessage && (
                          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-700 dark:text-red-300">
                            {job.errorMessage}
                          </div>
                        )}
                        {(job.status === 'failed' || job.status === 'paused') && (
                          <button
                            onClick={() => resumeGeneration()}
                            className="mt-3 w-full px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-medium"
                          >
                            Resume from {job.currentPhase || 'last checkpoint'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Failed Tasks */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Failed Tasks
                  {failedTasks.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-red-500">
                      ({failedTasks.length})
                    </span>
                  )}
                </h2>
                <button
                  onClick={fetchFailedTasks}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  Refresh
                </button>
              </div>
              <div className="p-6">
                {failedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">✓</div>
                    <p className="text-slate-600 dark:text-slate-400">
                      No failed tasks. Everything looks good!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {failedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-red-500">✗</span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {task.agentId}
                          </span>
                          <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {task.phase}
                          </span>
                        </div>
                        {task.errorMessage && (
                          <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                            {task.errorMessage}
                          </p>
                        )}
                        <div className="text-xs text-slate-500 flex gap-4">
                          {task.retryCount > 0 && (
                            <span>Retries: {task.retryCount}</span>
                          )}
                          {task.durationMs && (
                            <span>Duration: {Math.round(task.durationMs / 1000)}s</span>
                          )}
                        </div>
                        {task.errorDetails && Object.keys(task.errorDetails).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                              View error details
                            </summary>
                            <pre className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(task.errorDetails, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                    {canResume && (
                      <button
                        onClick={() => resumeGeneration()}
                        className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600"
                      >
                        Resume Generation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Build Instructions Modal */}
      {showBuildModal && buildInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Build Instructions</h3>
              <button
                onClick={() => setShowBuildModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                {(buildInstructions as { instructions?: { note?: string } })?.instructions?.note}
              </p>
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400 font-mono">
                  {((buildInstructions as { instructions?: { steps?: string[] } })?.instructions?.steps || []).map((step: string, i: number) => (
                    <li key={i}>{step.replace(/^\d+\.\s*/, '')}</li>
                  ))}
                </ol>
              </div>
              <a
                href={(buildInstructions as { instructions?: { docs?: string } })?.instructions?.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-600 text-sm"
              >
                View Expo Build Documentation →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Preview Instructions Modal */}
      {showPreviewModal && previewInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Preview Instructions</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                {(previewInstructions as { instructions?: { note?: string } })?.instructions?.note}
              </p>
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400 font-mono">
                  {((previewInstructions as { instructions?: { steps?: string[] } })?.instructions?.steps || []).map((step: string, i: number) => (
                    <li key={i}>{step.replace(/^\d+\.\s*/, '')}</li>
                  ))}
                </ol>
              </div>
              <div className="flex gap-4">
                <a
                  href={(previewInstructions as { instructions?: { expoGoLinks?: { ios?: string } } })?.instructions?.expoGoLinks?.ios}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm"
                >
                  Get Expo Go (iOS) →
                </a>
                <a
                  href={(previewInstructions as { instructions?: { expoGoLinks?: { android?: string } } })?.instructions?.expoGoLinks?.android}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm"
                >
                  Get Expo Go (Android) →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
