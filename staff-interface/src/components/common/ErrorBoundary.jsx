import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Staff Console ErrorBoundary caught an exception:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-[#070709] text-slate-900 dark:text-white flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-500 dark:text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto">
                            <AlertTriangle size={28} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Console Exception Caught
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                An unexpected runtime error occurred on this operations screen. The system integrity has been preserved.
                            </p>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer active:scale-98"
                        >
                            <RotateCcw size={16} />
                            <span>Reload Console</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
