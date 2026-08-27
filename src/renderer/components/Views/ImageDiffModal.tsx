import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../UI/Modal';
import { CaptureItem } from '../../../shared/types';
import { Columns, SplitSquareVertical, Sliders, ArrowLeftRight, Eye, Play, Pause, Zap, Edit3, Sparkles, Loader2 } from 'lucide-react';
import { useGlobalModal } from '../../contexts/GlobalModalContext';
import { useCaptureStore } from '../../stores/captureStore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface ImageDiffModalProps {
    isOpen: boolean;
    onClose: () => void;
    captures: CaptureItem[];
    initialLeftCapture?: CaptureItem | null;
    initialRightCapture?: CaptureItem | null;
}

type DiffMode = 'slider' | 'side-by-side' | 'blend';
type BlendType = 'opacity' | 'difference' | 'exclusion';

async function resolveSrc(src: string): Promise<string> {
    if (src && src.startsWith('media://') && window.electron?.readImage) {
        try {
            const res = await window.electron.readImage(src);
            if (typeof res === 'string' && res.startsWith('data:')) return res;
        } catch {}
    }
    return src;
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (!src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });
}

export const ImageDiffModal: React.FC<ImageDiffModalProps> = ({
    isOpen,
    onClose,
    captures,
    initialLeftCapture,
    initialRightCapture
}) => {
    const { openImageEditor } = useGlobalModal();
    const { addCapture } = useCaptureStore();

    const [leftId, setLeftId] = useState<string>(initialLeftCapture?.id || (captures[0]?.id || ''));
    const [rightId, setRightId] = useState<string>(initialRightCapture?.id || (captures[1]?.id || captures[0]?.id || ''));
    const [mode, setMode] = useState<DiffMode>('slider');
    const [sliderPos, setSliderPos] = useState<number>(50); // 0% to 100%
    const [blendOpacity, setBlendOpacity] = useState<number>(50); // 0% to 100%
    const [blendType, setBlendType] = useState<BlendType>('opacity');
    const [isFlickering, setIsFlickering] = useState<boolean>(false);
    const [flickerState, setFlickerState] = useState<boolean>(false);
    const [isExportingDiff, setIsExportingDiff] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const leftCapture = captures.find(c => c.id === leftId) || initialLeftCapture || captures[0];
    const rightCapture = captures.find(c => c.id === rightId) || initialRightCapture || captures[1] || captures[0];

    // Flicker interval effect
    useEffect(() => {
        if (!isFlickering) return;
        const interval = setInterval(() => {
            setFlickerState(prev => !prev);
        }, 400);
        return () => clearInterval(interval);
    }, [isFlickering]);

    if (!leftCapture || !rightCapture) return null;

    const swapCaptures = () => {
        const temp = leftId;
        setLeftId(rightId);
        setRightId(temp);
    };

    const handlePointerInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = Math.round((x / rect.width) * 1000) / 10;
        setSliderPos(percentage);
    };

    const handleExportAndEdit = async () => {
        setIsExportingDiff(true);
        try {
            const [leftSrc, rightSrc] = await Promise.all([
                resolveSrc(leftCapture.thumbnail),
                resolveSrc(rightCapture.thumbnail)
            ]);

            const [leftImg, rightImg] = await Promise.all([
                loadImage(leftSrc),
                loadImage(rightSrc)
            ]);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get 2D context');

            if (mode === 'side-by-side') {
                const gap = 16;
                const topHeaderH = 48;
                const maxH = Math.max(leftImg.height, rightImg.height);
                canvas.width = leftImg.width + rightImg.width + gap;
                canvas.height = maxH + topHeaderH;

                // Background
                ctx.fillStyle = '#090d16';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Left Header
                ctx.fillStyle = '#2563eb';
                ctx.fillRect(0, 0, leftImg.width, topHeaderH);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px sans-serif';
                ctx.fillText(`BASE (ANTES) - ${leftCapture.title || 'Paso Base'}`, 20, 31);

                // Right Header
                ctx.fillStyle = '#ea580c';
                ctx.fillRect(leftImg.width + gap, 0, rightImg.width, topHeaderH);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px sans-serif';
                ctx.fillText(`COMPARACIÓN (DESPUÉS) - ${rightCapture.title || 'Paso Actual'}`, leftImg.width + gap + 20, 31);

                // Draw Images
                ctx.drawImage(leftImg, 0, topHeaderH);
                ctx.drawImage(rightImg, leftImg.width + gap, topHeaderH);

                // Divider Line
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(leftImg.width, 0, gap, canvas.height);

            } else if (mode === 'slider') {
                const maxW = Math.max(leftImg.width, rightImg.width);
                const maxH = Math.max(leftImg.height, rightImg.height);
                canvas.width = maxW;
                canvas.height = maxH;

                // Draw Right / Comparison Image underneath
                ctx.drawImage(rightImg, 0, 0, maxW, maxH);

                // Clip & Draw Left / Base Image on top
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, maxW * (sliderPos / 100), maxH);
                ctx.clip();
                ctx.drawImage(leftImg, 0, 0, maxW, maxH);
                ctx.restore();

                // Glowing divider line
                const divX = maxW * (sliderPos / 100);
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(divX, 0);
                ctx.lineTo(divX, maxH);
                ctx.stroke();

            } else {
                // mode === 'blend'
                const maxW = Math.max(leftImg.width, rightImg.width);
                const maxH = Math.max(leftImg.height, rightImg.height);
                canvas.width = maxW;
                canvas.height = maxH;

                ctx.drawImage(leftImg, 0, 0, maxW, maxH);

                if (blendType === 'difference') {
                    ctx.globalCompositeOperation = 'difference';
                    ctx.drawImage(rightImg, 0, 0, maxW, maxH);
                } else if (blendType === 'exclusion') {
                    ctx.globalCompositeOperation = 'exclusion';
                    ctx.drawImage(rightImg, 0, 0, maxW, maxH);
                } else {
                    ctx.globalAlpha = blendOpacity / 100;
                    ctx.drawImage(rightImg, 0, 0, maxW, maxH);
                }
            }

            const compositeDataUrl = canvas.toDataURL('image/png');
            const newId = uuidv4();
            const modeLabel = mode === 'slider'
                ? `Cortina (${Math.round(sliderPos)}%)`
                : mode === 'blend'
                ? `Diferencia ${blendType.toUpperCase()}`
                : 'Lado a Lado';

            const newCapture: CaptureItem = {
                id: newId,
                thumbnail: compositeDataUrl,
                title: `Comparativa: ${leftCapture.title || 'Base'} vs ${rightCapture.title || 'Actual'}`,
                description: `Comparativa visual en modo ${modeLabel}. Listo para resaltar diferencias.`,
                timestamp: Date.now(),
                status: 'success',
                metadata: {
                    source: 'diff_comparison',
                    diffMode: mode
                }
            };

            addCapture(newCapture);
            onClose();
            openImageEditor(newCapture);
            toast.success('¡Comparativa guardada! Se ha abierto el editor para que anotes las diferencias.');
        } catch (error) {
            console.error('Failed to export comparison:', error);
            toast.error('Error al generar la imagen comparativa');
        } finally {
            setIsExportingDiff(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onCancel={onClose}
            title=""
            description={null}
            showFooter={false}
            maxWidth="max-w-[94vw]"
        >
            <div className="flex flex-col gap-3.5 h-[84vh] max-h-[900px] w-full">
                {/* Control Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
                    {/* Capture Selectors */}
                    <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                                Base (Antes / Esperado)
                            </label>
                            <select
                                value={leftId}
                                onChange={(e) => setLeftId(e.target.value)}
                                className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                            className="mt-4 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-500 transition-colors"
                            title="Intercambiar capturas"
                        >
                            <ArrowLeftRight size={16} />
                        </button>

                        <div className="flex-1">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">
                                Comparación (Después / Actual)
                            </label>
                            <select
                                value={rightId}
                                onChange={(e) => setRightId(e.target.value)}
                                className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                    <div className="flex items-center gap-1 p-1 bg-gray-200/80 dark:bg-gray-700/60 rounded-xl">
                        <button
                            onClick={() => { setMode('slider'); setIsFlickering(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                mode === 'slider'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <SplitSquareVertical size={14} />
                            Cortina Deslizante
                        </button>
                        <button
                            onClick={() => { setMode('side-by-side'); setIsFlickering(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                mode === 'side-by-side'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Columns size={14} />
                            Lado a Lado
                        </button>
                        <button
                            onClick={() => setMode('blend')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                mode === 'blend'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Sliders size={14} />
                            Superposición / Diferencia
                        </button>
                    </div>

                    {/* Export & Edit Action Button */}
                    <button
                        onClick={handleExportAndEdit}
                        disabled={isExportingDiff}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
                        }}
                        title="Exportar esta comparativa como evidencia y abrir el editor para dibujar y marcar diferencias"
                    >
                        {isExportingDiff ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <Sparkles size={15} />
                        )}
                        <span>Sacar Comparativa y Editar</span>
                    </button>
                </div>

                {/* Main Diff Display Area */}
                <div
                    ref={containerRef}
                    className="relative flex-1 w-full rounded-2xl overflow-hidden bg-gray-950 flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-inner select-none"
                >
                    {/* MODE 1: CORTINA / SLIDER */}
                    {mode === 'slider' && (
                        <div
                            className="relative w-full h-full flex items-center justify-center cursor-ew-resize overflow-hidden touch-none"
                            onPointerDown={(e) => {
                                e.currentTarget.setPointerCapture(e.pointerId);
                                handlePointerInteraction(e);
                            }}
                            onPointerUp={(e) => {
                                try {
                                    e.currentTarget.releasePointerCapture(e.pointerId);
                                } catch {}
                            }}
                            onPointerMove={(e) => {
                                if (e.buttons === 1) {
                                    handlePointerInteraction(e);
                                }
                            }}
                        >
                            {/* Layer 1: Bottom Image (Right / Comparison) */}
                            <img
                                src={rightCapture.thumbnail}
                                alt="Comparación"
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-2"
                            />

                            {/* Layer 2: Top Image (Left / Base) - Polygon Clipped */}
                            <img
                                src={leftCapture.thumbnail}
                                alt="Base"
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none p-2"
                                style={{
                                    clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`
                                }}
                            />

                            {/* Glowing Divider Line */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
                                style={{
                                    left: `${sliderPos}%`,
                                    boxShadow: '0 0 12px 2px rgba(255,255,255,0.7), 0 0 24px 4px rgba(59,130,246,0.5)'
                                }}
                            >
                                {/* Drag Handle */}
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-gray-900 shadow-2xl flex items-center justify-center border-2 border-blue-500 scale-100 hover:scale-110 transition-transform">
                                    <ArrowLeftRight size={15} className="text-blue-600" />
                                </div>
                            </div>

                            {/* Position Badges */}
                            <div className="absolute top-3 left-3 bg-black/75 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md z-30 pointer-events-none border border-white/10 shadow-lg">
                                Base ({Math.round(sliderPos)}%)
                            </div>
                            <div className="absolute top-3 right-3 bg-black/75 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md z-30 pointer-events-none border border-white/10 shadow-lg">
                                Comparación ({Math.round(100 - sliderPos)}%)
                            </div>
                        </div>
                    )}

                    {/* MODE 2: LADO A LADO */}
                    {mode === 'side-by-side' && (
                        <div className="grid grid-cols-2 gap-3 w-full h-full p-3">
                            <div className="relative rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-gray-800">
                                <span className="absolute top-3 left-3 bg-blue-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow z-10 backdrop-blur-md">
                                    Base (#{captures.findIndex(c => c.id === leftId) + 1})
                                </span>
                                <img src={leftCapture.thumbnail} alt="Left" className="w-full h-full object-contain p-2" />
                            </div>
                            <div className="relative rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-gray-800">
                                <span className="absolute top-3 left-3 bg-amber-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow z-10 backdrop-blur-md">
                                    Comparación (#{captures.findIndex(c => c.id === rightId) + 1})
                                </span>
                                <img src={rightCapture.thumbnail} alt="Right" className="w-full h-full object-contain p-2" />
                            </div>
                        </div>
                    )}

                    {/* MODE 3: SUPERPOSICIÓN / DIFFERENCE */}
                    {mode === 'blend' && (
                        <div className="relative w-full h-full flex items-center justify-center p-2">
                            {isFlickering ? (
                                <img
                                    src={flickerState ? rightCapture.thumbnail : leftCapture.thumbnail}
                                    alt="Flicker"
                                    className="w-full h-full object-contain p-2 transition-all duration-75"
                                />
                            ) : (
                                <>
                                    <img
                                        src={leftCapture.thumbnail}
                                        alt="Base"
                                        className="absolute inset-0 w-full h-full object-contain p-2"
                                    />
                                    <img
                                        src={rightCapture.thumbnail}
                                        alt="Overlay"
                                        className="absolute inset-0 w-full h-full object-contain p-2 transition-all duration-150"
                                        style={{
                                            opacity: blendType === 'opacity' ? blendOpacity / 100 : 1,
                                            mixBlendMode: blendType === 'difference' ? 'difference' : blendType === 'exclusion' ? 'exclusion' : 'normal'
                                        }}
                                    />
                                </>
                            )}

                            {/* Badge Indicator */}
                            <div className="absolute top-3 left-3 bg-black/80 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl backdrop-blur-md z-30 border border-white/10 shadow-lg flex items-center gap-1.5">
                                <Zap size={13} className="text-amber-400" />
                                <span>{isFlickering ? `Alternando (${flickerState ? 'Comparación' : 'Base'})` : `Modo: ${blendType.toUpperCase()}`}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm text-xs">
                    {mode === 'slider' && (
                        <div className="flex items-center gap-3 w-full">
                            <span className="font-semibold text-gray-500">Posición Cortina:</span>
                            <div className="flex gap-1.5">
                                {[0, 25, 50, 75, 100].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setSliderPos(val)}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                            Math.round(sliderPos) === val
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                                        }`}
                                    >
                                        {val}%
                                    </button>
                                ))}
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliderPos}
                                onChange={(e) => setSliderPos(Number(e.target.value))}
                                className="flex-1 accent-blue-600"
                            />
                            <span className="font-bold w-12 text-right">{Math.round(sliderPos)}%</span>
                        </div>
                    )}

                    {mode === 'blend' && (
                        <div className="flex items-center justify-between gap-4 w-full">
                            {/* Blend Type Selector */}
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-500">Efecto:</span>
                                <div className="flex gap-1 bg-gray-200 dark:bg-gray-700 p-0.5 rounded-xl">
                                    <button
                                        onClick={() => { setBlendType('opacity'); setIsFlickering(false); }}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                            blendType === 'opacity' && !isFlickering ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500'
                                        }`}
                                    >
                                        Transparencia
                                    </button>
                                    <button
                                        onClick={() => { setBlendType('difference'); setIsFlickering(false); }}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                            blendType === 'difference' && !isFlickering ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500'
                                        }`}
                                        title="Diferencia RGB (Píxeles modificados brillan en color)"
                                    >
                                        Diferencia Píxeles
                                    </button>
                                    <button
                                        onClick={() => { setBlendType('exclusion'); setIsFlickering(false); }}
                                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                                            blendType === 'exclusion' && !isFlickering ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500'
                                        }`}
                                    >
                                        Exclusión
                                    </button>
                                </div>
                            </div>

                            {/* Opacity Slider */}
                            {blendType === 'opacity' && !isFlickering && (
                                <div className="flex items-center gap-2 flex-1 max-w-xs">
                                    <span className="text-gray-500">Opacidad:</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={blendOpacity}
                                        onChange={(e) => setBlendOpacity(Number(e.target.value))}
                                        className="flex-1 accent-blue-600"
                                    />
                                    <span className="font-bold w-10 text-right">{blendOpacity}%</span>
                                </div>
                            )}

                            {/* Quick Flicker Toggle */}
                            <button
                                onClick={() => setIsFlickering(prev => !prev)}
                                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                    isFlickering
                                        ? 'bg-amber-500 text-white animate-pulse'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300'
                                }`}
                                title="Alternar rápidamente entre ambas capturas para detectar cambios sutiles"
                            >
                                {isFlickering ? <Pause size={14} /> : <Play size={14} />}
                                {isFlickering ? 'Detener Parpadeo' : 'Parpadeo Rápido'}
                            </button>
                        </div>
                    )}

                    {mode === 'side-by-side' && (
                        <div className="flex items-center justify-between w-full text-gray-500">
                            <span>Compara ambas capturas lado a lado en tamaño completo.</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Resolución Adaptativa</span>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
