import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Welcome to <span className="text-primary-500">Mobigen</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl">
            AI-powered mobile app generation platform. Create production-ready React Native
            apps in minutes with natural language.
          </p>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 bg-white text-primary-500 border-2 border-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Describe your app in natural language and let AI build it for you
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Production-Ready</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Built with React Native, Expo, and industry best practices
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Fast Deployment</h3>
              <p className="text-slate-600 dark:text-slate-300">
                From idea to app store in record time with automated builds
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
