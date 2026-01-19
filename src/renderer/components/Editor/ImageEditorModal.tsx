
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, Rect, Circle, IText, FabricImage, Point } from 'fabric';
import { Check, Square, Circle as CircleIcon, Type, Trash2, Hand, MousePointer2 } from 'lucide-react';
import { Tooltip } from '../UI/Tooltip';
import { toast, confirm } from '../../utils/toast';
import { CaptureItem, useCaptureStore } from '../../stores/captureStore';

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


    // Tools Actions
    const addRect = () => {
        if (!fabricCanvas) return;
        setActiveTool('select');
        const vpt = fabricCanvas.viewportTransform!;
        // Add shape to center of current viewport
        const center = fabricCanvas.getVpCenter();

        const rect = new Rect({
            left: center.x,
            top: center.y,
            originX: 'center',
            originY: 'center',
            fill: 'transparent',
            stroke: color,
            strokeWidth: 4 / fabricCanvas.getZoom(), // Adjust stroke for zoom
            width: 100,
            height: 100,
            transparentCorners: false,
            cornerColor: 'white',
            cornerStrokeColor: 'gray',
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
            cornerColor: 'white',
            cornerStrokeColor: 'gray',
            cornerSize: 10
        });
        fabricCanvas.add(circle);
        fabricCanvas.setActiveObject(circle);
    };

    const addText = () => {
        if (!fabricCanvas) return;
        setActiveTool('select');
        const center = fabricCanvas.getVpCenter();

        const text = new IText('Note', {
            left: center.x,
            top: center.y,
            originX: 'center',
            originY: 'center',
            fill: color,
            fontSize: 24,
            fontFamily: 'sans-serif'
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    const deleteActive = () => {
        if (!fabricCanvas) return;
        const active = fabricCanvas.getActiveObject();
        if (active) {
            fabricCanvas.remove(active);
        }
    };

    const handleSave = () => {
        if (!fabricCanvas) return;

        // Ensure metadata is saved final time
        updateCapture(capture.id, { title, description });

        // 1. Reset Viewport to contain the image 
        // Or create a temporary canvas to export only the image bounds?
        // Easiest: Export using multiplier based on original image dimensions

        // Find the background image
        const objects = fabricCanvas.getObjects();
        const bgImg = objects.find(o => o instanceof FabricImage) as FabricImage;

        if (!bgImg) return;

        // Calculate crop area (the image itself)
        const cropX = bgImg.left - (bgImg.width! * bgImg.scaleX!) / 2;
        const cropY = bgImg.top - (bgImg.height! * bgImg.scaleY!) / 2;
        const width = bgImg.width! * bgImg.scaleX!;
        const height = bgImg.height! * bgImg.scaleY!;

        // Export only the area of the image
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
                    className="rounded-xl overflow-hidden shadow-2xl flex flex-col w-[95vw] h-[90vh] border"
                    style={{
                        background: 'var(--system-background)',
                        borderColor: 'var(--separator-opaque)'
                    }}
                >
                    <div
                        className="p-2 flex items-center gap-4 border-b"
                        style={{
                            background: 'var(--system-background-secondary)',
                            borderColor: 'var(--separator-opaque)'
                        }}
                    >
                        {/* Tool Selection */}
                        <div
                            className="flex rounded-lg p-1 border shadow-sm"
                            style={{
                                background: 'var(--system-background)',
                                borderColor: 'var(--separator-opaque)'
                            }}
                        >
                            <Tooltip text="Select / Move Objects">
                                <button
                                    onClick={() => setActiveTool('select')}
                                    className="p-2 rounded"
                                    style={activeTool === 'select' ? {
                                        background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                        color: 'var(--system-blue)'
                                    } : {
                                        color: 'var(--label-secondary)'
                                    }}
                                    onMouseEnter={(e) => { if (activeTool !== 'select') e.currentTarget.style.background = 'var(--fill-secondary)'; }}
                                    onMouseLeave={(e) => { if (activeTool !== 'select') e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <MousePointer2 size={20} />
                                </button>
                            </Tooltip>
                            <Tooltip text="Pan Tool (Hand)">
                                <button
                                    onClick={() => setActiveTool('hand')}
                                    className="p-2 rounded"
                                    style={activeTool === 'hand' ? {
                                        background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
                                        color: 'var(--system-blue)'
                                    } : {
                                        color: 'var(--label-secondary)'
                                    }}
                                    onMouseEnter={(e) => { if (activeTool !== 'hand') e.currentTarget.style.background = 'var(--fill-secondary)'; }}
                                    onMouseLeave={(e) => { if (activeTool !== 'hand') e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <Hand size={20} />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="h-6 w-px mx-2" style={{ background: 'var(--separator-opaque)' }}></div>

                        <Tooltip text="Add Rectangle">
                            <button
                                onClick={addRect}
                                className="p-2 rounded"
                                style={activeTool === 'rect' ? { background: 'var(--fill-secondary)', color: 'var(--label-primary)' } : { color: 'var(--label-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                onMouseLeave={(e) => { if (activeTool !== 'rect') e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Square size={20} />
                            </button>
                        </Tooltip>
                        <Tooltip text="Add Circle">
                            <button
                                onClick={addCircle}
                                className="p-2 rounded"
                                style={{ color: 'var(--label-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <CircleIcon size={20} />
                            </button>
                        </Tooltip>
                        <Tooltip text="Add Text">
                            <button
                                onClick={addText}
                                className="p-2 rounded"
                                style={{ color: 'var(--label-secondary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fill-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <Type size={20} />
                            </button>
                        </Tooltip>

                        <div className="h-6 w-px mx-2" style={{ background: 'var(--separator-opaque)' }}></div>

                        {/* Colors */}
                        <div className="flex gap-1">
                            {['#ef4444', '#22c55e', '#3b82f6', '#000000'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="flex-1"></div>

                        <p className="text-xs mr-4" style={{ color: 'var(--label-tertiary)' }}>Scroll to Zoom • Drag to Pan</p>

                        <Tooltip text="Delete Selected Object" position="left">
                            <button
                                onClick={deleteActive}
                                className="p-2 rounded transition-colors"
                                style={{ color: 'var(--system-red)' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--system-red) 15%, transparent)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <Trash2 size={20} />
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

