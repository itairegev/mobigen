interface ValidationError {
  file?: string;
  line?: number;
  message: string;
  fixable?: boolean;
}

interface ValidationResultProps {
  checkName: string;
  passed: boolean;
  required: boolean;
  duration?: number;
  errors?: ValidationError[];
}

export function ValidationResult({
  checkName,
  passed,
  required,
  duration,
  errors = []
}: ValidationResultProps) {
  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${
      passed
        ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
        : required
        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
        : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {passed ? '✅' : required ? '❌' : '⚠️'}
          </span>
          <div>
            <h5 className={`font-semibold ${
              passed
                ? 'text-green-900 dark:text-green-100'
                : required
                ? 'text-red-900 dark:text-red-100'
                : 'text-yellow-900 dark:text-yellow-100'
            }`}>
              {checkName}
            </h5>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className={`px-2 py-0.5 rounded ${
                required
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {required ? 'Required' : 'Optional'}
              </span>
              {duration !== undefined && (
                <span className="text-slate-500 dark:text-slate-400">
                  {duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {!passed && errors.length > 0 && (
        <div className="mt-3 space-y-2">
          {errors.slice(0, 5).map((error, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded p-3 text-sm border border-slate-200 dark:border-slate-700"
            >
              {error.file && (
                <div className="font-mono text-xs text-slate-600 dark:text-slate-400 mb-1">
                  {error.file}
                  {error.line && `:${error.line}`}
                </div>
              )}
              <div className="text-slate-900 dark:text-white">
                {error.message}
              </div>
              {error.fixable && (
                <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <span>🔧</span>
                  <span>Auto-fixable</span>
                </div>
              )}
            </div>
          ))}
          {errors.length > 5 && (
            <div className="text-xs text-slate-500 dark:text-slate-400 italic">
              + {errors.length - 5} more errors
            </div>
          )}
        </div>
      )}
    </div>
  );
}
