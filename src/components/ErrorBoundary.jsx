import React from 'react';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    try {
      if (this.props.onReset) {
        this.props.onReset();
      } else {
        window.location.href = window.location.pathname;
      }
    } catch (e) {
      window.location.reload();
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleCopyError = () => {
    const errorText = `${this.state.error?.toString()}\n\nStack:\n${this.state.errorInfo?.componentStack || this.state.error?.stack || ''}`;
    navigator.clipboard?.writeText(errorText);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: () => this.setState({ hasError: false, error: null, errorInfo: null })
        });
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/40 p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <AlertOctagon className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-200 dark:border-rose-800">
                ระบบป้องกันหน้าจอขาว (White Screen Prevention)
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                พบข้อผิดพลาดในการแสดงผลหน้านี้
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                ระบบได้ดักจับข้อผิดพลาดเพื่อป้องกันหน้าจอขาว (White Screen) ข้อมูลของคุณยังคงปลอดภัยในระบบ กรุณาลองโหลดใหม่อีกครั้ง หรือกลับสู่หน้าหลัก
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>โหลดหน้าเว็บใหม่ (Reload)</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>กลับสู่หน้าแรก / ภาพรวม</span>
              </button>
            </div>

            {/* Collapsible Error Technical Details */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center space-x-1 cursor-pointer font-medium"
              >
                <span>รายละเอียดทางเทคนิค (Technical Details)</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 text-left p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto space-y-2 relative border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[11px] text-rose-400 font-semibold">
                      {this.state.error?.name || 'Error'}: {this.state.error?.message}
                    </span>
                    <button
                      onClick={this.handleCopyError}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      {this.state.copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{this.state.copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] text-slate-400 overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack || this.state.error?.stack || 'No stack trace available'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
