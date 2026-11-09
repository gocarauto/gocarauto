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
        console.error('Portal ErrorBoundary caught an exception:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-6">
                    <div className="max-w-md w-full p-8 rounded-3xl bg-[#0c0d12] border border-white/10 shadow-2xl text-center space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto">
                            <AlertTriangle size={28} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Temporary Display Issue
                            </h2>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                An unexpected issue occurred while rendering this view. Your session and records are completely safe.
                            </p>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all cursor-pointer active:scale-98"
                        >
                            <RotateCcw size={16} />
                            <span>Reload Portal</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
