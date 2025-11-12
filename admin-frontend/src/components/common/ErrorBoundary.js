import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { ArrowPathIcon, HomeIcon, BugAntIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and potentially to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Here you could send error to error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-5 bg-gray-50 dark:bg-gray-900">
          <Card className="max-w-2xl w-full text-center">
            <div className="py-8">
              <BugAntIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              <div className="flex justify-center gap-3">
                <Button
                  type="primary"
                  icon={<ArrowPathIcon className="h-4 w-4" />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button
                  icon={<HomeIcon className="h-4 w-4" />}
                  onClick={this.handleGoHome}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-2">
                  Error Details (Development Only)
                </h3>
                
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">Error:</h4>
                  <pre className="bg-white dark:bg-gray-800 p-3 rounded text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">Stack Trace:</h4>
                  <pre className="bg-white dark:bg-gray-800 p-3 rounded text-xs text-gray-900 dark:text-gray-100 overflow-x-auto max-h-48 overflow-y-auto">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If this problem persists, please contact our support team or try refreshing the page.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;