import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureItem } from '../../../shared/types';
import { Columns, SplitSquareVertical, Sliders, ArrowLeftRight, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImageDiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    captures: CaptureItem[];
    initialLeftCapture?: CaptureItem | null;
    initialRightCapture?: CaptureItem | null;
}

type DiffMode = 'slider' | 'side-by-side' | 'blend';

export const ImageDiffModal: React.FC<ImageDiffModalProps> = ({
    isOpen,
    onClose,
    captures,
    initialLeftCapture,
    initialRightCapture
}) => {
    const [leftId, setLeftId] = useState<string>(initialLeftCapture?.id || (captures[0]?.id || ''));
    const [rightId, setRightId] = useState<string>(initialRightCapture?.id || (captures[1]?.id || captures[0]?.id || ''));
    const [mode, setMode] = useState<DiffMode>('slider');
    const [sliderPos, setSliderPos] = useState<number>(50); // 0% to 100%
    const [blendOpacity, setBlendOpacity] = useState<number>(50); // 0% to 100%

    const leftCapture = captures.find(c => c.id === leftId) || initialLeftCapture || captures[0];
    const rightCapture = captures.find(c => c.id === rightId) || initialRightCapture || captures[1] || captures[0];

    if (!leftCapture || !rightCapture) return null;

    const swapCaptures = () => {
        const temp = leftId;
        setLeftId(rightId);
        setRightId(temp);
    };

    return (
        <Modal
            isOpen={isOpen}
            onCancel={onClose}
            title="Comparador Visual de Evidencias (Visual Diff)"
            description={null}
            showFooter={false}
            maxWidth="6xl"
        >
            <div className="flex flex-col gap-4 max-h-[82vh] overflow-hidden">
                {/* Control Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                    {/* Capture Selectors */}
                    <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                                Base (Antes / Esperado)
                            </label>
                            <select
                                value={leftId}
                                onChange={(e) => setLeftId(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            >
                                {captures.map((c, i) => (
                                    <option key={c.id} value={c.id}>
                                        #{i + 1} — {c.title || `Captura ${i + 1}`} ({new Date(c.timestamp).toLocaleTimeString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={swapCaptures}
                            className="mt-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                            title="Intercambiar capturas"
                        >
                            <ArrowLeftRight size={16} />
                        </button>

                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                                Comparación (Después / Actual)
                            </label>
                            <select
                                value={rightId}
                                onChange={(e) => setRightId(e.target.value)}
                                className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            >
                                {captures.map((c, i) => (
                                    <option key={c.id} value={c.id}>
                                        #{i + 1} — {c.title || `Captura ${i + 1}`} ({new Date(c.timestamp).toLocaleTimeString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-700/60 rounded-xl">
                        <button
                            onClick={() => setMode('slider')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                mode === 'slider'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <SplitSquareVertical size={14} />
                            Cortina Deslizante
                        </button>
                        <button
                            onClick={() => setMode('side-by-side')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                mode === 'side-by-side'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <Columns size={14} />
                            Lado a Lado
                        </button>
                        <button
                            onClick={() => setMode('blend')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                                mode === 'blend'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                        >
                            <Sliders size={14} />
                            Superposición
                        </button>
                    </div>
                </div>

                {/* Main Diff Display Area */}
                <div className="relative min-h-[440px] max-h-[550px] flex-1 rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-800 select-none">
                    {mode === 'slider' && (
                        <div
                            className="relative w-full h-full flex items-center justify-center cursor-ew-resize overflow-hidden"
                            onMouseMove={(e) => {
                                if (e.buttons === 1) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                    setSliderPos((x / rect.width) * 100);
                                }
                            }}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                setSliderPos((x / rect.width) * 100);
                            }}
                        >
                            {/* Base Image (Underneath) */}
                            <img
                                src={rightCapture.thumbnail}
                                alt="Actual"
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            />

                            {/* Top Image (Clipped by slider position) */}
                            <div
                                className="absolute inset-0 h-full overflow-hidden"
                                style={{ width: `${sliderPos}%` }}
                            >
                                <img
                                    src={leftCapture.thumbnail}
                                    alt="Expected"
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>

                            {/* Divider Line & Handle */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl z-20 pointer-events-none"
                                style={{ left: `${sliderPos}%` }}
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-gray-800 shadow-xl flex items-center justify-center border border-gray-300">
                                    <ArrowLeftRight size={14} />
                                </div>
                            </div>

                            {/* Position Badges */}
                            <div className="absolute top-3 left-3 bg-black/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md z-30">
                                Base ({Math.round(sliderPos)}%)
                            </div>
                            <div className="absolute top-3 right-3 bg-black/70 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md z-30">
                                Comparación ({Math.round(100 - sliderPos)}%)
                            </div>
                        </div>
                    )}

                    {mode === 'side-by-side' && (
                        <div className="grid grid-cols-2 gap-2 w-full h-full p-2">
                            <div className="relative rounded-lg overflow-hidden bg-black/40 flex flex-col items-center justify-center border border-gray-800">
                                <span className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
                                    Base
                                </span>
                                <img src={leftCapture.thumbnail} alt="Left" className="w-full h-full object-contain" />
                            </div>
                            <div className="relative rounded-lg overflow-hidden bg-black/40 flex flex-col items-center justify-center border border-gray-800">
                                <span className="absolute top-2 left-2 bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
                                    Comparación
                                </span>
                                <img src={rightCapture.thumbnail} alt="Right" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    )}

                    {mode === 'blend' && (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            <img src={leftCapture.thumbnail} alt="Base" className="absolute inset-0 w-full h-full object-contain" />
                            <img
                                src={rightCapture.thumbnail}
                                alt="Overlay"
                                className="absolute inset-0 w-full h-full object-contain transition-opacity"
                                style={{ opacity: blendOpacity / 100 }}
                            />
                        </div>
                    )}
                </div>

                {/* Blend opacity slider if in blend mode */}
                {mode === 'blend' && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-xs font-medium text-gray-500">Opacidad de Mezcla:</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={blendOpacity}
                            onChange={(e) => setBlendOpacity(Number(e.target.value))}
                            className="flex-1 accent-blue-600"
                        />
                        <span className="text-xs font-bold w-12 text-right">{blendOpacity}%</span>
                    </div>
                )}
            </div>
        </Modal>
    );
};
