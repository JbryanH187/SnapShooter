
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Circle, IText, FabricImage, Point } from 'fabric';
import {
    Check,
    Square,
    Circle as CircleIcon,
    Type,
    Trash2,
    Hand,
    MousePointer2,
    Target,
    ArrowRight,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Hash,
    ZoomIn,
    ZoomOut,
    Copy
} from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import { toast, confirm } from '../../utils/toast';
import { CaptureItem, useCaptureStore } from '../../stores/captureStore';

const STAMP_SVGS: Record<string, (color: string, num?: number) => string> = {
    target: (c) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-width="4" stroke-dasharray="6 4" />
            <circle cx="48" cy="48" r="26" fill="${c}" fill-opacity="0.3" stroke="#ffffff" stroke-width="3" />
            <circle cx="48" cy="48" r="10" fill="${c}" stroke="#ffffff" stroke-width="2.5" />
            <line x1="48" y1="4" x2="48" y2="24" stroke="${c}" stroke-width="4" stroke-linecap="round" />
            <line x1="48" y1="72" x2="48" y2="92" stroke="${c}" stroke-width="4" stroke-linecap="round" />
            <line x1="4" y1="48" x2="24" y2="48" stroke="${c}" stroke-width="4" stroke-linecap="round" />
            <line x1="72" y1="48" x2="92" y2="48" stroke="${c}" stroke-width="4" stroke-linecap="round" />
        </svg>`,
    hand: (c) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="${c}" fill-opacity="0.25" stroke="#ffffff" stroke-width="1.2" />
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" fill="#ffffff" fill-opacity="0.9" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
    mouse: (c) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="${c}" fill-opacity="0.2" stroke="#ffffff" stroke-width="1.2" />
            <path d="m4 4 7.07 17 2.51-7.39L21 11.07z" fill="${c}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
    dot: (c) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="${c}" fill-opacity="0.25" />
            <circle cx="40" cy="40" r="24" fill="${c}" fill-opacity="0.45" stroke="#ffffff" stroke-width="3" />
            <circle cx="40" cy="40" r="12" fill="${c}" stroke="#ffffff" stroke-width="3" />
        </svg>`,
    arrow: (c) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="11" fill="${c}" fill-opacity="0.15" stroke="none" />
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
        </svg>`,
    step: (c, num = 1) => `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="${c}" stroke="#ffffff" stroke-width="4" />
            <text x="40" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" text-anchor="middle">${num}</text>
        </svg>`,
    check: () => `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" fill="#22c55e" fill-opacity="0.25" />
            <path d="m9 12 2 2 4-4" stroke="#22c55e" stroke-width="3" />
        </svg>`,
    cross: () => `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" fill="#ef4444" fill-opacity="0.25" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="#ef4444" stroke-width="3" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="#ef4444" stroke-width="3" />
        </svg>`,
    alert: () => `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="#f59e0b" fill-opacity="0.25" />
            <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" stroke-width="3" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" stroke-width="3" />
        </svg>`
};

interface ImageEditorModalProps {
    capture: CaptureItem;
    onClose: () => void;
    onSave: (id: string, newThumbnail: string) => void;
    onDelete: (id: string) => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ capture, onClose, onSave, onDelete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'hand' | 'rect' | 'circle' | 'text'>('select');
    const [color, setColor] = useState('#ef4444'); // Red default
    const scaleRef = useRef<number>(1); // Store original image scale

    // Metadata State
    const [title, setTitle] = useState(capture.title || '');
    const [description, setDescription] = useState(capture.description || '');
    const updateCapture = useCaptureStore(state => state.updateCapture);

    // Sync metadata changes immediately? Or on save?
    // User expects "Save Changes" to save everything.
    // However, store updates for text usually happen on blur or change.
    // Let's update on Blur to keep it snappy.

    const handleTitleBlur = () => {
        if (title !== capture.title) {
            updateCapture(capture.id, { title });
        }
    };

    const handleDescriptionBlur = () => {
        if (description !== capture.description) {
            updateCapture(capture.id, { description });
        }
    };

    // Handle Delete
    const handleDeleteCapture = async () => {
        const confirmed = await confirm({
            title: '¿Eliminar captura?',
            text: '¿Estás seguro de que deseas eliminar esta captura? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (confirmed) {
            onDelete(capture.id);
            onClose();
        }
    };

    // Initialize Canvas
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        // Initialize canvas to fill the container
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const canvas = new Canvas(canvasRef.current, {
            width: width,
            height: height,
            selection: true
        });

        setFabricCanvas(canvas);

        // Load Image
        const imgObj = new Image();
        imgObj.src = capture.thumbnail;
        imgObj.onload = () => {
            const fabricImg = new FabricImage(imgObj);

            // Calculate scale to "contain" the image within the canvas with some padding
            const padding = 50;
            const availableWidth = width - (padding * 2);
            const availableHeight = height - (padding * 2);

            const scaleX = availableWidth / fabricImg.width!;
            const scaleY = availableHeight / fabricImg.height!;
            const scale = Math.min(scaleX, scaleY, 1); // Never scale up pixelated, max 1

            scaleRef.current = scale;
            fabricImg.scale(scale);

            // Center the image
            fabricImg.set({
                left: width / 2,
                top: height / 2,
                originX: 'center',
                originY: 'center',
                selectable: false, // Image itself isn't selectable/movable by default
                evented: false     // Click events pass through to canvas
            });

            canvas.add(fabricImg);
            canvas.sendObjectToBack(fabricImg);
            canvas.renderAll();
        };

        // Resize observer to handle window resize? (Optional for now)

        return () => {
            canvas.dispose();
        };
    }, []);

    // Tool Switching Logic
    useEffect(() => {
        if (!fabricCanvas) return;

        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = activeTool === 'select';

        // Update cursor based on tool
        if (activeTool === 'hand') {
            fabricCanvas.defaultCursor = 'grab';
            fabricCanvas.hoverCursor = 'grab';
            fabricCanvas.moveCursor = 'grabbing';
            // Make all objects unselectable while panning
            fabricCanvas.forEachObject(obj => obj.selectable = false);
        } else {
            fabricCanvas.defaultCursor = 'default';
            fabricCanvas.hoverCursor = 'move';
            fabricCanvas.moveCursor = 'move';
            // Restore selectability (except background image if we want)
            fabricCanvas.forEachObject(obj => {
                if (obj instanceof FabricImage) return; // Keep bg locked
                obj.selectable = true;
            });
        }

        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();

    }, [activeTool, fabricCanvas]);

    // Pan & Zoom Logic
    useEffect(() => {
        if (!fabricCanvas) return;

        let isDragging = false;
        let lastPosX = 0;
        let lastPosY = 0;

        const onMouseDown = (opt: any) => {
            if (activeTool === 'hand') {
                const evt = opt.e;
                isDragging = true;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
                fabricCanvas.setCursor('grabbing');
            }
        };

        const onMouseMove = (opt: any) => {
            if (isDragging && activeTool === 'hand') {
                const evt = opt.e;
                const vpt = fabricCanvas.viewportTransform!;
                vpt[4] += evt.clientX - lastPosX;
                vpt[5] += evt.clientY - lastPosY;
                fabricCanvas.requestRenderAll();
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
            }
        };

        const onMouseUp = () => {
            if (activeTool === 'hand') {
                isDragging = false;
                fabricCanvas.setCursor('grab');
            }
        };

        const onMouseWheel = (opt: any) => {
            const delta = opt.e.deltaY;
            let zoom = fabricCanvas.getZoom();
            zoom *= 0.999 ** delta;
            if (zoom > 20) zoom = 20;
            if (zoom < 0.1) zoom = 0.1;

            // Zoom to point
            fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY } as Point, zoom);

            opt.e.preventDefault();
            opt.e.stopPropagation();
        };

        fabricCanvas.on('mouse:down', onMouseDown);
        fabricCanvas.on('mouse:move', onMouseMove);
        fabricCanvas.on('mouse:up', onMouseUp);
        fabricCanvas.on('mouse:wheel', onMouseWheel);

        return () => {
            fabricCanvas.off('mouse:down', onMouseDown);
            fabricCanvas.off('mouse:move', onMouseMove);
            fabricCanvas.off('mouse:up', onMouseUp);
            fabricCanvas.off('mouse:wheel', onMouseWheel);
        };
    }, [fabricCanvas, activeTool]);


    const [selectedObject, setSelectedObject] = useState<any>(null);

    // Selection listener
    useEffect(() => {
        if (!fabricCanvas) return;
        const updateSelection = () => {
            const active = fabricCanvas.getActiveObject();
            setSelectedObject(active && !(active instanceof FabricImage && active.selectable === false) ? active : null);
        };
        fabricCanvas.on('selection:created', updateSelection);
        fabricCanvas.on('selection:updated', updateSelection);
        fabricCanvas.on('selection:cleared', updateSelection);
        return () => {
            fabricCanvas.off('selection:created', updateSelection);
            fabricCanvas.off('selection:updated', updateSelection);
            fabricCanvas.off('selection:cleared', updateSelection);
        };
    }, [fabricCanvas]);

    // Keyboard Shortcuts (Delete, Backspace, Ctrl+D Duplicate)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteActive();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                duplicateActive();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [fabricCanvas]);

    // Tools Actions
    const addRect = () => {
        if (!fabricCanvas) return;
        setActiveTool('select');
        const center = fabricCanvas.getVpCenter();

        const rect = new Rect({
            left: center.x,
            top: center.y,
            originX: 'center',
            originY: 'center',
            fill: 'transparent',
            stroke: color,
            strokeWidth: 4 / fabricCanvas.getZoom(),
            width: 100,
            height: 100,
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#ffffff',
            cornerSize: 10
        });
        fabricCanvas.add(rect);
        fabricCanvas.setActiveObject(rect);
    };

    const addCircle = () => {
        if (!fabricCanvas) return;
        setActiveTool('select');
        const center = fabricCanvas.getVpCenter();

        const circle = new Circle({
            left: center.x,
            top: center.y,
            originX: 'center',
            originY: 'center',
            fill: 'transparent',
            stroke: color,
            strokeWidth: 4 / fabricCanvas.getZoom(),
            radius: 50,
            transparentCorners: false,
            cornerColor: '#3b82f6',
            cornerStrokeColor: '#ffffff',
            cornerSize: 10
        });
        fabricCanvas.add(circle);
        fabricCanvas.setActiveObject(circle);
    };

    const addText = () => {
        if (!fabricCanvas) return;
        setActiveTool('select');
        const center = fabricCanvas.getVpCenter();

        const text = new IText('Nota QA', {
            left: center.x,
            top: center.y,
            originX: 'center',
            originY: 'center',
            fill: color,
            fontSize: 24,
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    const addStamp = (type: string) => {
        if (!fabricCanvas) return;
        setActiveTool('select');
        const center = fabricCanvas.getVpCenter();

        let svgStr = '';
        if (type === 'step') {
            const existingSteps = fabricCanvas.getObjects().filter(o => (o as any).customType === 'step');
            const nextNum = existingSteps.length + 1;
            svgStr = STAMP_SVGS.step(color, nextNum);
        } else if (STAMP_SVGS[type]) {
            svgStr = STAMP_SVGS[type](color);
        }
        if (!svgStr) return;

        const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.trim())}`;
        const imgElement = new Image();
        imgElement.src = svgDataUrl;
        imgElement.onload = () => {
            const fabricObj = new FabricImage(imgElement, {
                left: center.x,
                top: center.y,
                originX: 'center',
                originY: 'center',
                cornerColor: '#3b82f6',
                cornerStrokeColor: '#ffffff',
                cornerSize: 10,
                transparentCorners: false,
                borderColor: '#3b82f6',
                borderScaleFactor: 1.5,
            });
            (fabricObj as any).customType = type;
            (fabricObj as any).stampColor = color;
            fabricCanvas.add(fabricObj);
            fabricCanvas.setActiveObject(fabricObj);
            fabricCanvas.requestRenderAll();
        };
    };

    const scaleActiveObject = (factor: number) => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active && !(active instanceof FabricImage && active.selectable === false)) {
            const currentScaleX = active.scaleX || 1;
            const currentScaleY = active.scaleY || 1;
            active.scaleX = Math.max(0.15, currentScaleX * factor);
            active.scaleY = Math.max(0.15, currentScaleY * factor);
            fabricCanvas.requestRenderAll();
        }
    };

    const duplicateActive = () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active && !(active instanceof FabricImage && active.selectable === false)) {
            active.clone().then((cloned: any) => {
                cloned.set({
                    left: (active.left || 0) + 20,
                    top: (active.top || 0) + 20,
                    cornerColor: '#3b82f6',
                    cornerStrokeColor: '#ffffff',
                    cornerSize: 10,
                    transparentCorners: false,
                });
                fabricCanvas.add(cloned);
                fabricCanvas.setActiveObject(cloned);
                fabricCanvas.requestRenderAll();
            });
        }
    };

    const deleteActive = () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active) {
            fabricCanvas.remove(active);
            setSelectedObject(null);
        }
    };

    const handleSave = () => {
        if (!fabricCanvas) return;

        // Ensure metadata is saved final time
        updateCapture(capture.id, { title, description });

        // Find the background image
        const objects = fabricCanvas.getObjects();
        const bgImg = objects.find(o => o instanceof FabricImage && o.selectable === false) as FabricImage;

        if (!bgImg) return;

        // Calculate crop area (the image itself)
        const cropX = bgImg.left - (bgImg.width! * bgImg.scaleX!) / 2;
        const cropY = bgImg.top - (bgImg.height! * bgImg.scaleY!) / 2;
        const width = bgImg.width! * bgImg.scaleX!;
        const height = bgImg.height! * bgImg.scaleY!;

        // Export only the area of the image (baking all stamps & shapes permanently)
        const dataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            left: cropX,
            top: cropY,
            width: width,
            height: height,
            multiplier: 1 / bgImg.scaleX! // Restore original resolution
        });

        onSave(capture.id, dataUrl);
        onClose();
    };

    // Update active object color when color picker changes
    useEffect(() => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active) {
            if (active.type === 'i-text') {
                active.set('fill', color);
            } else if ((active as any).customType) {
                // If it's a stamp, reload its SVG with the new color
                const type = (active as any).customType;
                let svgStr = '';
                if (type === 'step') {
                    svgStr = STAMP_SVGS.step(color);
                } else if (STAMP_SVGS[type]) {
                    svgStr = STAMP_SVGS[type](color);
                }
                if (svgStr) {
                    const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.trim())}`;
                    const imgElement = new Image();
                    imgElement.src = svgDataUrl;
                    imgElement.onload = () => {
                        (active as FabricImage).setElement(imgElement);
                        (active as any).stampColor = color;
                        fabricCanvas.requestRenderAll();
                    };
                }
            } else {
                active.set('stroke', color);
            }
            fabricCanvas.requestRenderAll();
        }
    }, [color, fabricCanvas]);

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div
                    className="rounded-xl overflow-hidden shadow-2xl flex flex-col w-[96vw] h-[92vh] border"
                    style={{
                        background: 'var(--system-background)',
                        borderColor: 'var(--separator-opaque)'
                    }}
                >
                    {/* Top Toolbar */}
                    <div
                        className="p-2 flex items-center gap-3 border-b flex-wrap"
                        style={{
                            background: 'var(--system-background-secondary)',
                            borderColor: 'var(--separator-opaque)'
                        }}
                    >
                        {/* 1. Selection & Pan */}
                        <div
                            className="flex rounded-lg p-1 border shadow-sm"
                            style={{
                                background: 'var(--system-background)',
                                borderColor: 'var(--separator-opaque)'
                            }}
                        >
                            <Tooltip text="Seleccionar / Mover / Escalar Objetos" position="bottom">
                                <button
                                    onClick={() => setActiveTool('select')}
                                    className="p-1.5 rounded"
                                    style={activeTool === 'select' ? {
                                        background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                        color: 'var(--system-blue)'
                                    } : {
                                        color: 'var(--label-secondary)'
                                    }}
                                >
                                    <MousePointer2 size={18} />
                                </button>
                            </Tooltip>
                            <Tooltip text="Herramienta Mano (Mover Lienzo)" position="bottom">
                                <button
                                    onClick={() => setActiveTool('hand')}
                                    className="p-1.5 rounded"
                                    style={activeTool === 'hand' ? {
                                        background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                        color: 'var(--system-blue)'
                                    } : {
                                        color: 'var(--label-secondary)'
                                    }}
                                >
                                    <Hand size={18} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="h-5 w-px" style={{ background: 'var(--separator-opaque)' }}></div>

                        {/* 2. Basic Shapes & Text */}
                        <div className="flex items-center gap-1">
                            <Tooltip text="Rectángulo" position="bottom">
                                <button
                                    onClick={addRect}
                                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--label-secondary)' }}
                                >
                                    <Square size={18} />
                                </button>
                            </Tooltip>
                            <Tooltip text="Círculo" position="bottom">
                                <button
                                    onClick={addCircle}
                                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--label-secondary)' }}
                                >
                                    <CircleIcon size={18} />
                                </button>
                            </Tooltip>
                            <Tooltip text="Texto" position="bottom">
                                <button
                                    onClick={addText}
                                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    style={{ color: 'var(--label-secondary)' }}
                                >
                                    <Type size={18} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="h-5 w-px" style={{ background: 'var(--separator-opaque)' }}></div>

                        {/* 3. Punteros & Clicks (QuickFlow Stamps) */}
                        <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border"
                            style={{
                                background: 'var(--system-background)',
                                borderColor: 'var(--separator-opaque)'
                            }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1" style={{ color: 'var(--label-tertiary)' }}>
                                Clicks
                            </span>
                            <Tooltip text="Estampar Mirilla / Target" position="bottom">
                                <button
                                    onClick={() => addStamp('target')}
                                    className="p-1.5 rounded hover:bg-amber-500/15 text-amber-500 transition-colors"
                                >
                                    <Target size={18} className="stroke-[2.5]" />
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Mano de Click" position="bottom">
                                <button
                                    onClick={() => addStamp('hand')}
                                    className="p-1.5 rounded hover:bg-amber-500/15 text-amber-500 transition-colors"
                                >
                                    <Hand size={18} className="stroke-[2.5]" />
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Cursor de Mouse" position="bottom">
                                <button
                                    onClick={() => addStamp('mouse')}
                                    className="p-1.5 rounded hover:bg-amber-500/15 text-amber-500 transition-colors"
                                >
                                    <MousePointer2 size={18} className="stroke-[2.5]" />
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Punto / Glow Dot" position="bottom">
                                <button
                                    onClick={() => addStamp('dot')}
                                    className="p-1.5 rounded hover:bg-red-500/15 text-red-500 transition-colors"
                                >
                                    <CircleIcon size={18} className="stroke-[3] fill-red-500/30" />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="h-5 w-px" style={{ background: 'var(--separator-opaque)' }}></div>

                        {/* 4. QA Annotations & Stamps */}
                        <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border"
                            style={{
                                background: 'var(--system-background)',
                                borderColor: 'var(--separator-opaque)'
                            }}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1" style={{ color: 'var(--label-tertiary)' }}>
                                QA
                            </span>
                            <Tooltip text="Estampar Flecha" position="bottom">
                                <button
                                    onClick={() => addStamp('arrow')}
                                    className="p-1.5 rounded hover:bg-blue-500/15 text-blue-500 transition-colors"
                                >
                                    <ArrowRight size={18} className="stroke-[2.5]" />
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Paso Numerado (#1, #2, #3...)" position="bottom">
                                <button
                                    onClick={() => addStamp('step')}
                                    className="p-1.5 rounded hover:bg-blue-500/15 text-blue-600 transition-colors font-bold flex items-center gap-0.5"
                                >
                                    <Hash size={16} />
                                    <span className="text-xs">Paso</span>
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Aprobado / Éxito" position="bottom">
                                <button
                                    onClick={() => addStamp('check')}
                                    className="p-1.5 rounded hover:bg-green-500/15 text-green-500 transition-colors"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Bug / Error" position="bottom">
                                <button
                                    onClick={() => addStamp('cross')}
                                    className="p-1.5 rounded hover:bg-red-500/15 text-red-500 transition-colors"
                                >
                                    <XCircle size={18} />
                                </button>
                            </Tooltip>
                            <Tooltip text="Estampar Alerta / Warning" position="bottom">
                                <button
                                    onClick={() => addStamp('alert')}
                                    className="p-1.5 rounded hover:bg-amber-500/15 text-amber-500 transition-colors"
                                >
                                    <AlertTriangle size={18} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="h-5 w-px" style={{ background: 'var(--separator-opaque)' }}></div>

                        {/* 5. Color Palette */}
                        <div className="flex gap-1.5 items-center">
                            {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-5 h-5 rounded-full border transition-transform ${color === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1' : 'border-gray-400 opacity-80 hover:opacity-100'}`}
                                    style={{ backgroundColor: c }}
                                    title={`Color: ${c}`}
                                />
                            ))}
                        </div>

                        {/* 6. Selected Object Controls (Quick Size Scale & Duplicate) */}
                        {selectedObject && (
                            <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Tamaño:</span>
                                <Tooltip text="Reducir Tamaño (-20%)" position="bottom">
                                    <button
                                        onClick={() => scaleActiveObject(0.8)}
                                        className="p-1 rounded hover:bg-blue-500/20 text-blue-600 transition-colors"
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                </Tooltip>
                                <Tooltip text="Aumentar Tamaño (+20%)" position="bottom">
                                    <button
                                        onClick={() => scaleActiveObject(1.25)}
                                        className="p-1 rounded hover:bg-blue-500/20 text-blue-600 transition-colors"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                </Tooltip>
                                <div className="h-4 w-px bg-blue-300 dark:bg-blue-700 mx-1"></div>
                                <Tooltip text="Duplicar Objeto (Ctrl+D)" position="bottom">
                                    <button
                                        onClick={duplicateActive}
                                        className="p-1 rounded hover:bg-blue-500/20 text-blue-600 transition-colors"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}

                        <div className="flex-1"></div>

                        <p className="text-xs mr-2 hidden lg:inline" style={{ color: 'var(--label-tertiary)' }}>
                            Tira de las esquinas para escalar • Rueda para zoom
                        </p>

                        <Tooltip text="Eliminar Objeto Seleccionado (Supr / Backspace)" position="bottom">
                            <button
                                onClick={deleteActive}
                                className="p-1.5 rounded transition-colors"
                                style={{ color: 'var(--system-red)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 15%, transparent)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </Tooltip>
                    </div>

                    <div ref={containerRef} className="flex-1 overflow-hidden relative checkerboard-bg" style={{ background: 'var(--fill-tertiary)' }}>
                        <canvas ref={canvasRef} />
                    </div>

                    {/* Bottom Bar: Metadata & Actions */}
                    <div
                        className="p-4 border-t flex justify-between gap-3 flex-shrink-0 items-end"
                        style={{
                            borderColor: 'var(--separator-opaque)',
                            background: 'var(--system-background)'
                        }}
                    >
                        {/* Metadata Inputs */}
                        <div className="flex-1 flex flex-col gap-2 max-w-xl mr-4">
                            <input
                                type="text"
                                placeholder="Capture Title (optional)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                className="w-full px-3 py-1.5 text-sm rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                style={{
                                    background: 'var(--fill-tertiary)',
                                    border: '1px solid var(--separator-opaque)',
                                    color: 'var(--label-primary)'
                                }}
                            />
                            <textarea
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleDescriptionBlur}
                                rows={1}
                                className="w-full px-3 py-1.5 text-xs rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none h-[32px] focus:h-[64px]"
                                style={{
                                    background: 'var(--fill-tertiary)',
                                    border: '1px solid var(--separator-opaque)',
                                    color: 'var(--label-secondary)'
                                }}
                            />
                        </div>

                        <div className="flex gap-3 items-center">
                            <button
                                onClick={handleDeleteCapture}
                                className="px-3 py-2 rounded-lg transition-colors flex items-center gap-2 hover:bg-red-500/10"
                                style={{ color: 'var(--system-red)' }}
                                title="Delete Capture"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg transition-colors"
                                style={{ color: 'var(--label-primary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Check size={18} /> Save & Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

