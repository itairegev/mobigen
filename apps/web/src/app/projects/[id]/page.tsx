'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useGenerator } from '@/hooks/useGenerator';
import type { GenerationPhase, ProjectConfig } from '@/lib/types';

type Tab = 'progress' | 'chat' | 'files' | 'preview';

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>('progress');
  const [hasStarted, setHasStarted] = useState(false);

  // Project info from URL params (in real app, fetch from API)
  const projectName = searchParams.get('name') || 'My App';
  const template = searchParams.get('template') || 'base';
  const prompt = searchParams.get('prompt') || '';
  const primaryColor = searchParams.get('primaryColor') || '#3b82f6';
  const secondaryColor = searchParams.get('secondaryColor') || '#10b981';
  const bundleId = searchParams.get('bundleId') || `com.app.${projectName.toLowerCase().replace(/\s+/g, '')}`;

  // Use the real generator hook
  const {
    isConnected,
    isGenerating,
    phases,
    currentPhaseIndex,
    filesGenerated,
    progress,
    result,
    error,
    startGeneration,
  } = useGenerator({ projectId, autoConnect: true });

  // Start generation when we have a prompt and connection
  useEffect(() => {
    if (prompt && isConnected && !hasStarted && !isGenerating && !result) {
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
      startGeneration(prompt, config);
    }
  }, [prompt, isConnected, hasStarted, isGenerating, result, projectId, projectName, bundleId, primaryColor, secondaryColor, startGeneration]);

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
              {generationComplete && (
                <>
                  <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                    Download
                  </button>
                  <button className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600">
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
              <button
                onClick={() => {
                  setHasStarted(false);
                }}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            {(['progress', 'chat', 'files', 'preview'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

              {/* Prompt Card */}
              {prompt && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Your Request</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {decodeURIComponent(prompt)}
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
                <button className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600">
                  Launch Preview
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
