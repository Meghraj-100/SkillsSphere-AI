import React from "react";
import PropTypes from "prop-types";
import Button from "../shared/components/Button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: null,
      errorInfo: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      error,
      hasError: true,
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Unhandled React rendering error:", error, errorInfo);

    // Future logging integrations can be connected here.
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleTryAgain = () => {
    this.setState({
      error: null,
      errorInfo: null,
      hasError: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { children } = this.props;
    const { error, errorInfo, hasError } = this.state;
    const showDetails = import.meta.env.DEV && (error || errorInfo);

    if (!hasError) {
      return children;
    }

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-dark-bg dark:text-text-main sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center text-center">
          <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
              <span className="text-2xl font-semibold" aria-hidden="true">
                !
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              The page hit an unexpected error, but the app is still running.
              Try again, or reload the page if the problem continues.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={this.handleTryAgain} variant="primary">
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                Reload Page
              </Button>
            </div>

            {showDetails && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
                  Error details
                </summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                  {error?.stack || String(error)}
                  {errorInfo?.componentStack
                    ? `\n${errorInfo.componentStack}`
                    : ""}
                </pre>
              </details>
            )}
          </div>
        </section>
      </main>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
