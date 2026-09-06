import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Component Error Caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 bg-[#101419] border border-[#ffb4ab]/40 rounded text-xs font-mono text-[#ffdad6] my-2">
          <div className="font-bold flex items-center gap-1.5 text-[#ffb4ab] mb-1">
            <span className="material-symbols-outlined text-sm">shield</span>
            <span>TACTICAL COMPONENT STANDALONE RECOVERY</span>
          </div>
          <p className="text-[11px] text-[#bbc9ca]">Component operating in fallback safe mode.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
