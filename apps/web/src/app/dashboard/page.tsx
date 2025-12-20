'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { ProjectCard } from '@/components/projects/ProjectCard';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [status, router]);

  // Fetch projects from API
  const { data: projects, isLoading, error } = trpc.projects.list.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  // Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load projects</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const projectList = projects || [];
  const activeProjects = projectList.filter((p) => p.status === 'active');
  const buildingProjects = projectList.filter((p) => p.status === 'building');
  const uniqueTemplates = new Set(projectList.map((p) => p.templateId).filter(Boolean));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                My Projects
              </h1>
              {session?.user?.name && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Welcome back, {session.user.name}
                </p>
              )}
            </div>
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              <span>New Project</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {projectList.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No projects yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first mobile app with AI
            </p>
            <Link
              href="/projects/new"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Create Your First App
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {projectList.length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeProjects.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-400">Building</p>
                <p className="text-2xl font-bold text-yellow-600">{buildingProjects.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-600 dark:text-slate-400">Templates Used</p>
                <p className="text-2xl font-bold text-primary-600">{uniqueTemplates.size}</p>
              </div>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectList.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  template={project.templateId || 'base'}
                  status={project.status}
                  lastModified={formatRelativeTime(project.updatedAt)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return then.toLocaleDateString();
}
