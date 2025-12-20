import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  template: string;
  status: string;
  lastModified: string;
}

export function ProjectCard({ id, name, template, status, lastModified }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'building':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'ecommerce':
        return '🛍️';
      case 'loyalty':
        return '🎁';
      case 'news':
        return '📰';
      case 'ai-assistant':
        return '🤖';
      default:
        return '📱';
    }
  };

  return (
    <Link href={`/projects/${id}`}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="text-3xl">{getTemplateIcon(template)}</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{name}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Template: {template}</p>

        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
          🕐 Updated {lastModified}
        </div>
      </div>
    </Link>
  );
}
