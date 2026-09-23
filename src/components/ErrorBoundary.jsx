import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
    this.setState({ info });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e0e11] text-white p-8">
          <div className="bg-[#18181f] border border-red-500/30 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Interface Recovery</h2>
            <p className="text-xs text-zinc-400 mb-6">
              A view rendering error was safely caught. Click below to reload the workspace cleanly.
            </p>
            <div className="bg-[#111116] p-3 rounded-lg text-left text-xs font-mono text-red-300/80 mb-6 overflow-x-auto max-h-32 border border-zinc-800">
              {this.state.error?.toString()}
            </div>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
