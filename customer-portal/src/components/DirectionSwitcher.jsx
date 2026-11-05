import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Palette } from 'lucide-react';

const DIRECTIONS = [
    { id: '1', name: 'Obsidian Apex', subtitle: 'Monaco VIP Concierge', color: '#fbbf24' },
    { id: '2', name: 'Nordic Slate', subtitle: 'Precision Telemetry', color: '#10b981' },
    { id: '3', name: 'Alabaster Atelier', subtitle: 'Boutique Showroom', color: '#c0673f' }
];

export const useUIDirection = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const paramDir = searchParams.get('direction');
    const [direction, setDirection] = useState(() =>
        paramDir || localStorage.getItem('gocar_ui_direction') || '1'
    );

    const activeDirection = paramDir || direction;

    const changeDirection = (newDir) => {
        setDirection(newDir);
        localStorage.setItem('gocar_ui_direction', newDir);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('direction', newDir);
        setSearchParams(newParams);
    };

    return { direction: activeDirection, changeDirection };
};

const DirectionSwitcher = () => {
    const { direction, changeDirection } = useUIDirection();
    const [minimized, setMinimized] = useState(() => {
        return localStorage.getItem('gocar_switcher_minimized') === 'true';
    });

    const toggleMinimized = () => {
        const next = !minimized;
        setMinimized(next);
        localStorage.setItem('gocar_switcher_minimized', String(next));
    };

    return (
        <aside aria-label="Design Direction Switcher" className="fixed bottom-5 right-5 z-[9999] select-none">
            <AnimatePresence mode="wait">
                {minimized ? (
                    <motion.button
                        key="minimized"
                        onClick={toggleMinimized}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-12 h-12 rounded-full bg-black/90 dark:bg-white/90 text-white dark:text-black border border-white/20 dark:border-black/20 shadow-2xl flex items-center justify-center backdrop-blur-xl group"
                        title="Expand Design Direction Switcher"
                    >
                        <Eye size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#fbbf24] text-black text-[9px] font-black rounded-full flex items-center justify-center">
                            {direction}
                        </span>
                    </motion.button>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="bg-black/90 dark:bg-[#0c0d12]/95 border border-white/15 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl text-white w-72 flex flex-col gap-3"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-[#fbbf24]" />
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">Design Direction</span>
                            </div>
                            <button
                                onClick={toggleMinimized}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="Minimize switcher"
                            >
                                <EyeOff size={15} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {DIRECTIONS.map((dir) => {
                                const isActive = direction === dir.id;
                                return (
                                    <button
                                        key={dir.id}
                                        onClick={() => changeDirection(dir.id)}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-all duration-200 ${
                                            isActive
                                                ? 'bg-white/15 border border-white/20 shadow-inner'
                                                : 'hover:bg-white/5 border border-transparent opacity-75 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                                style={{ backgroundColor: dir.color }}
                                            />
                                            <div>
                                                <p className="text-xs font-black tracking-tight leading-none text-white">
                                                    {dir.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    {dir.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fbbf24] text-black">
                                                Active
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
};

export default DirectionSwitcher;
