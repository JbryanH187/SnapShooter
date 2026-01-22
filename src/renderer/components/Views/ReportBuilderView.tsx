import React, { useEffect, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    useDraggable,
    useDroppable,
    closestCenter
} from '@dnd-kit/core';
import { Layout, LayoutTemplate, FileText, ChevronDown, Plus, Trash2, Save, Palette, Layers, Square, Circle, Triangle, Waves, Eye, Paintbrush, Sliders } from 'lucide-react';
import { useTemplateStore } from '../../stores/templateStore';
import { BlockType, BackgroundPattern, TemplateBackground, DecorationType, TemplateDecoration, ReportTemplate } from '../../../shared/types';
import { LiquidGlass } from '../UI/LiquidGlass';
import { BuilderSidebar } from '../Builder/BuilderSidebar';
// import { BuilderCanvas } from '../Builder/BuilderCanvas'; // Removed, using PageCanvas
import { PageCanvas } from '../Builder/PageCanvas';
import { toast } from '../../utils/toast';
import { jsPDF } from 'jspdf';
import { DynamicTemplate } from '../../../shared/reporting/DynamicTemplate';


const TrashZone = ({ isActive }: { isActive: boolean }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: 'trash-zone',
    });

    if (!isActive) return null;

    // Moved to bottom-left corner and made smaller to avoid accidental drops
    return (
        <div
            ref={setNodeRef}
            className={`fixed bottom-4 left-4 transition-all duration-300 z-50 rounded-2xl flex items-center justify-center gap-2 border shadow-2xl backdrop-blur-md
                ${isOver ? 'w-32 h-14 bg-red-500/90 border-red-400 scale-110' : 'w-24 h-12 bg-white/80 dark:bg-gray-800/80 border-red-200'}`}
        >
            <Trash2 size={isOver ? 24 : 18} className={isOver ? 'text-white' : 'text-red-500'} />
            {isOver && <span className="text-white text-xs font-bold">Delete</span>}
        </div>
    );
};

const DraggableDecoration: React.FC<{
    decoration: TemplateDecoration;
    accentColor: string;
    globalOpacity: number;
    globalBorderWidth: number;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<TemplateDecoration>) => void;
}> = ({ decoration, accentColor, globalOpacity, globalBorderWidth, onDelete, onUpdate }) => {
    // ... existing hook ...
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: decoration.id,
        data: {
            isSidebar: false,
            isDecoration: true,
            id: decoration.id,
            type: decoration.type,
            x: decoration.x,
            y: decoration.y
        }
    });

    const [isHovered, setIsHovered] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // ... resize logic same as before ... 
    const handleResizeStart = (e: React.PointerEvent, corner: string) => {
        // ... (keep same)
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = decoration.width;
        const startHeight = decoration.height;

        const handleMove = (moveEvent: PointerEvent) => {
            const deltaX = (moveEvent.clientX - startX) / 3.78;
            const deltaY = (moveEvent.clientY - startY) / 3.78;
            let newWidth = startWidth;
            let newHeight = startHeight;
            if (corner.includes('e')) newWidth = Math.max(5, startWidth + deltaX);
            if (corner.includes('s')) newHeight = Math.max(5, startHeight + deltaY);
            onUpdate(decoration.id, { width: newWidth, height: newHeight });
        };
        const handleUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${decoration.x}mm`,
        top: `${decoration.y}mm`,
        width: `${decoration.width}mm`,
        height: `${decoration.height}mm`,
        zIndex: isResizing ? 20 : 0,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.8 : (decoration.opacity !== undefined ? decoration.opacity : globalOpacity),
        cursor: isDragging ? 'grabbing' : 'grab',
        color: decoration.color || accentColor,
        border: (isHovered || isResizing) ? '1px dashed #3b82f6' : (decoration.type === 'square' || decoration.type === 'circle' ? `${globalBorderWidth}px solid transparent` : 'none'),
        pointerEvents: 'auto'
    };

    // Helper for SVG stroke
    const strokeStyle = {
        strokeWidth: globalBorderWidth,
        stroke: 'currentColor',
        fill: 'currentColor', // Or fill vs stroke? User said "rellenos" (fills) and "bordes" (borders).
        // Usually decorations are solid fill. "Border" might imply outline.
        // If solid fill, 'color' is fill. Border is extra.
        // Let's assume current implementation is fill-only.
        // If globalBorderWidth > 0, we might want to add stroke?
        // For simple shapes, let's just scale or set style.
    };

    // Actually, typically 'color' in this app has been the Fill color.
    // If user wants border thickness, they might imply an outline.
    // Let's update `renderShape` to better support borders if possible, or just ignore for now if complex.
    // The user said: "controlar la opacidad ... y bordes para saber que tan gruesos el borde de las figuras"
    // So distinct fill and border.

    // For this pass, let's apply opacity to the container (done).
    // Border width: apply to the shape style.

    // ... (rest of render)


    const renderShape = () => {
        switch (decoration.type) {
            case 'square': return <div style={{ width: '100%', height: '100%', background: 'currentColor', borderWidth: globalBorderWidth > 0 ? `${globalBorderWidth}px` : undefined, borderStyle: globalBorderWidth > 0 ? 'solid' : undefined, borderColor: 'var(--label-primary)' }}></div>;
            case 'circle': return <div style={{ width: '100%', height: '100%', background: 'currentColor', borderRadius: '50%', borderWidth: globalBorderWidth > 0 ? `${globalBorderWidth}px` : undefined, borderStyle: globalBorderWidth > 0 ? 'solid' : undefined, borderColor: 'var(--label-primary)' }}></div>;
            case 'triangle':
                return (
                    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <polygon points="50,0 100,100 0,100" fill="currentColor" stroke="var(--label-primary)" strokeWidth={globalBorderWidth * 2} strokeLinejoin="round" />
                    </svg>
                );
            case 'wave_decoration':
                // Waves is an icon, tough to border. Maybe drop shadow or filter?
                // Or just wrap in div.
                return (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <Waves size={Math.min(decoration.width, decoration.height) * 3} style={{ strokeWidth: Math.max(2, globalBorderWidth) }} />
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {renderShape()}

            {/* Delete Button */}
            {(isHovered || isResizing) && !isDragging && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(decoration.id);
                    }}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:scale-110 transition-transform shadow-md z-30"
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <Trash2 size={12} />
                </button>
            )}

            {/* Resize Handles */}
            {(isHovered || isResizing) && !isDragging && (
                <>
                    {/* Bottom Right Handle (General Resize) */}
                    <div
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-30"
                        onPointerDown={(e) => handleResizeStart(e, 'se')}
                    />
                    {/* Right Handle (Width) */}
                    <div
                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-white border border-blue-500 rounded-full cursor-e-resize z-20"
                        onPointerDown={(e) => handleResizeStart(e, 'e')}
                    />
                    {/* Bottom Handle (Height) */}
                    <div
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-blue-500 rounded-full cursor-s-resize z-20"
                        onPointerDown={(e) => handleResizeStart(e, 's')}
                    />
                </>
            )}
        </div>
    );
};

export const ReportBuilderView: React.FC = () => {
    // ... (Keep existing imports and setup)
    const {
        templates,
        activeTemplate,
        setActiveTemplate,
        addTemplate,
        deleteTemplate,
        updateTemplate,
        removeBlock,
        addBlock,
        moveBlock,
        saveActiveTemplate,
        addDecoration,
        updateDecoration,
        removeDecoration,
        updateBlock,
        addPage,
        removePage,
        updatePage
    } = useTemplateStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const [activeDragItem, setActiveDragItem] = useState<any>(null);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [showStyleMenu, setShowStyleMenu] = useState(false);
    const [viewMode, setViewMode] = useState<'landing' | 'builder'>('landing');
    const [templateName, setTemplateName] = useState('');
    const [showAddPageMenu, setShowAddPageMenu] = useState(false);

    useEffect(() => {
        if (activeTemplate) {
            setTemplateName(activeTemplate.name);
            // setViewMode('builder'); // Disable auto-switch to allow Landing on refresh/entry
        } else {
            setViewMode('landing');
        }
    }, [activeTemplate?.id, activeTemplate?.name]); // Sync only on load/ext change

    const handleNameBlur = () => {
        if (activeTemplate && templateName !== activeTemplate.name) {
            updateTemplate(activeTemplate.id, { name: templateName });
        }
    };

    // Preview Handler
    const handlePreview = async () => {
        // In a real app, this would generate the PDF blob and open it.
        if (!activeTemplate) return;
        try {
            const doc = new jsPDF();
            // Minimal config wrapper for the template
            // We use 'marketing' as base or 'simple', doesn't matter much as customTemplate overrides
            const template = new DynamicTemplate(doc, {
                id: 'preview',
                name: 'Preview',
                type: 'custom',
                customTemplate: activeTemplate,
                sections: [], // Not used by DynamicTemplate?
                settings: activeTemplate.settings // Pass settings if needed
            } as any); // Cast to any or ReportConfig mock

            // Render with empty captures for layout preview
            await template.renderContent([]);

            const blobUrl = doc.output('bloburl');
            window.open(blobUrl, '_blank');
        } catch (error) {
            console.error('Preview error:', error);
            toast.error('Failed to generate preview PDF');
        }
    };

    const handleNewTemplate = () => {
        const defaultPageId = crypto.randomUUID();
        addTemplate({
            name: 'New Template',
            pages: [
                {
                    id: defaultPageId,
                    type: 'content',
                    blocks: [],
                    order: 0
                }
            ],
            background: { pattern: 'none', color: '#000000', opacity: 0.1 },
            decorations: [],
            settings: {
                accentColor: '#3b82f6',
                textColor: 'black',
                globalBorderWidth: 1,
                blockBorderWidth: 1,
                decorationBorderWidth: 0,
                globalDecorationOpacity: 1
            }
        });
        setViewMode('builder');
    };

    const updateGlobalSettings = (updates: Partial<NonNullable<ReportTemplate['settings']>>) => {
        if (!activeTemplate) return;
        const currentSettings = activeTemplate.settings || {
            accentColor: '#3b82f6',
            textColor: 'black',
            globalBorderWidth: 1,
            blockBorderWidth: 1,
            decorationBorderWidth: 0,
            globalDecorationOpacity: 1
        };

        updateTemplate(activeTemplate.id, {
            settings: { ...currentSettings, ...updates }
        });
    };

    // ... (Inside render, update DraggableDecoration usage)
    // We need to pass the accent color to DraggableDecoration to use if own color is missing.
    // Actually, DraggableDecoration is defined outside. Let's redefine it inside or pass props.
    // Or better, accessing store inside DraggableDecoration might be cleaner? 
    // Let's modify DraggableDecoration to accept `accentColor` prop.
    // ...



    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragItem(active.data.current || { id: active.id });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over, delta } = event;

        if (!over) {
            setActiveDragItem(null);
            return;
        }

        // Handle Trash Drop
        if (over.id === 'trash-zone') {
            if (active.data.current?.isDecoration) {
                removeDecoration(active.id as string);
                toast.success('Decoration deleted');
            } else if (!active.data.current?.isSidebar) {
                // It's a block on the canvas (DragOverlay usually has isSidebar=true for new blocks)
                // Existing blocks have Sortable context where id is the block id.
                // We need to check if we can delete blocks this way.
                // SortableBlock passes id as string.
                removeBlock(active.id as string);
                toast.success('Block deleted');
            }
            setActiveDragItem(null);
            return;
        }

        // Handle Decorations
        // @ts-ignore
        if (active.data.current?.isDecoration) {
            // @ts-ignore
            if (active.data.current.isSidebar) {
                // Adding new decoration - calculate position based on drop location
                // For now, add at a default visible position
                addDecoration(active.data.current.type as DecorationType, 20, 20);
            } else {
                // Moving existing decoration
                // @ts-ignore
                const decorationId = active.data.current.id;
                // @ts-ignore
                const currentX = active.data.current.x;
                // @ts-ignore
                const currentY = active.data.current.y;

                // Convert px delta to mm (approx 3.78 px per mm)
                const deltaMM_X = delta.x / 3.78;
                const deltaMM_Y = delta.y / 3.78;

                updateDecoration(decorationId, {
                    x: currentX + deltaMM_X,
                    y: currentY + deltaMM_Y
                });
            }
            setActiveDragItem(null);
            return;
        }

        // Handle Blocks from Sidebar
        if (active.data.current?.isSidebar && !active.data.current?.isDecoration) {
            const type = active.data.current.type as BlockType;

            // Detect if dropped on a page
            const isDroppedOnPage = over.data.current?.isPage;
            const pageId = isDroppedOnPage ? (over.id as string) : undefined;

            // Add block to the target page (or first page if not dropped on a page)
            addBlock(type, pageId);
        }
        // Handle Reordering existing blocks
        else if (active.id !== over.id && !active.data.current?.isSidebar) {
            moveBlock(active.id.toString(), over.id.toString());
        }

        setActiveDragItem(null);
    };

    const handleSave = () => {
        saveActiveTemplate();
        toast.success('Template saved successfully');
    };

    const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this template?')) {
            deleteTemplate(id);
            if (activeTemplate?.id === id) {
                const remaining = templates.filter(t => t.id !== id);
                if (remaining.length > 0) {
                    setActiveTemplate(remaining[0]);
                } else {
                    handleNewTemplate();
                }
            }
        }
    };

    const updateBackground = (updates: Partial<TemplateBackground>) => {
        if (!activeTemplate) return;
        const currentBg = activeTemplate.background || { pattern: 'none', color: '#000000', opacity: 0.1 };
        updateTemplate(activeTemplate.id, {
            background: { ...currentBg, ...updates }
        });
    };

    if (viewMode === 'landing') {
        // ... (landing page remains same) ...
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 gap-8" style={{ background: 'var(--system-background)' }}>
                {/* ... existing landing code ... */}
                <div className="text-center space-y-2">
                    <div className="inline-block p-4 rounded-3xl mb-4 shadow-xl shadow-blue-500/20" style={{ background: 'var(--fill-secondary)' }}>
                        <LayoutTemplate size={64} className="text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--label-primary)' }}>Report Builder</h1>
                    <p className="text-lg max-w-md mx-auto" style={{ color: 'var(--label-secondary)' }}>
                        Create beautiful, data-driven reports with drag-and-drop ease.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                    <button
                        onClick={handleNewTemplate}
                        className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all hover:scale-105 hover:shadow-lg group"
                        style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)' }}
                    >
                        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Plus size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg" style={{ color: 'var(--label-primary)' }}>Create New</h3>
                            <p className="text-xs" style={{ color: 'var(--label-tertiary)' }}>Start from a blank canvas</p>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (templates.length > 0) {
                                setActiveTemplate(templates[0]);
                                setViewMode('builder');
                            } else {
                                toast.error("No saved templates found");
                            }
                        }}
                        className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all hover:scale-105 hover:shadow-lg group"
                        style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)' }}
                    >
                        <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <FileText size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg" style={{ color: 'var(--label-primary)' }}>Edit Existing</h3>
                            <p className="text-xs" style={{ color: 'var(--label-tertiary)' }}>
                                {templates.length} templates available
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900" style={{ background: 'var(--system-background)' }}>
                {/* Header - Compact */}
                <header className="flex-none flex justify-between items-center px-4 py-2 border-b z-20"
                    style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)' }}>
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)', color: 'var(--system-blue)' }}>
                            <LayoutTemplate size={18} />
                        </div>
                        <h1 className="text-sm font-bold truncate" style={{ color: 'var(--label-primary)' }}>
                            Builder
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Name Input */}
                        {/* Name Input */}
                        <div className="flex items-center gap-2 border-r pr-4 border-gray-200 dark:border-gray-700 h-9">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--label-tertiary)' }}>Name</span>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                onBlur={handleNameBlur}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                                className="border-none bg-transparent rounded px-2 py-1 text-sm font-bold focus:ring-0 w-32 lg:w-48 truncate"
                                style={{ color: 'var(--label-primary)' }}
                                placeholder="Report Name"
                            />
                        </div>

                        {/* Theme & Style settings */}
                        <div className="relative">
                            <button
                                onClick={() => setShowStyleMenu(!showStyleMenu)}
                                className="flex items-center gap-3 px-2 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                            >
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--label-tertiary)' }}>Theme</span>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-5 h-5 rounded-full shadow-sm border border-gray-200 group-hover:scale-110 transition-transform"
                                        style={{ background: activeTemplate?.settings?.accentColor || '#3b82f6' }}
                                    />
                                </div>
                            </button>

                            {showStyleMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowStyleMenu(false)}></div>
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-72 rounded-2xl shadow-2xl border z-20 overflow-hidden backdrop-blur-xl"
                                        style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)' }}>

                                        {/* Header Tabs */}
                                        <div className="flex border-b" style={{ borderColor: 'var(--separator-opaque)' }}>
                                            <div className="flex-1 p-3 text-center text-xs font-bold uppercase tracking-wider opacity-70 bg-black/5 dark:bg-white/5">
                                                Theme Settings
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-6">
                                            {/* Components Section */}
                                            <div>
                                                <h4 className="text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2" style={{ color: 'var(--label-primary)' }}>
                                                    <Layers size={12} /> Components
                                                </h4>

                                                {/* Block Border Width */}
                                                <div className="mb-2">
                                                    <label className="flex justify-between text-xs font-medium mb-1" style={{ color: 'var(--label-secondary)' }}>
                                                        <span>Block Border</span>
                                                        <span className="opacity-70">{activeTemplate?.settings?.blockBorderWidth ?? activeTemplate?.settings?.globalBorderWidth ?? 1}px</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0" max="10" step="1"
                                                        value={activeTemplate?.settings?.blockBorderWidth ?? activeTemplate?.settings?.globalBorderWidth ?? 1}
                                                        onChange={(e) => updateGlobalSettings({ blockBorderWidth: parseInt(e.target.value) })}
                                                        className="w-full accent-blue-500 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            <div className="w-full h-px bg-gray-200 dark:bg-gray-700"></div>

                                            {/* Decorations Section */}
                                            <div>
                                                <h4 className="text-xs font-bold uppercase mb-3 opacity-50 flex items-center gap-2" style={{ color: 'var(--label-primary)' }}>
                                                    <Paintbrush size={12} /> Decorations
                                                </h4>

                                                {/* Accent Color */}
                                                <div className="mb-4">
                                                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--label-secondary)' }}>Primary Color</label>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-inner ring-2 ring-gray-100 dark:ring-gray-700 hover:scale-105 transition-transform">
                                                            <input
                                                                type="color"
                                                                value={activeTemplate?.settings?.accentColor || '#3b82f6'}
                                                                onChange={(e) => updateGlobalSettings({ accentColor: e.target.value })}
                                                                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 cursor-pointer"
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono opacity-70" style={{ color: 'var(--label-primary)' }}>
                                                            {activeTemplate?.settings?.accentColor}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Shape Border Width */}
                                                <div className="mb-4">
                                                    <label className="flex justify-between text-xs font-medium mb-1" style={{ color: 'var(--label-secondary)' }}>
                                                        <span>Shape Border</span>
                                                        <span className="opacity-70">{activeTemplate?.settings?.decorationBorderWidth ?? activeTemplate?.settings?.globalBorderWidth ?? 0}px</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0" max="10" step="1"
                                                        value={activeTemplate?.settings?.decorationBorderWidth ?? activeTemplate?.settings?.globalBorderWidth ?? 0}
                                                        onChange={(e) => updateGlobalSettings({ decorationBorderWidth: parseInt(e.target.value) })}
                                                        className="w-full accent-blue-500 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                                                    />
                                                </div>

                                                {/* Global Decoration Opacity */}
                                                <div>
                                                    <label className="flex justify-between text-xs font-medium mb-1" style={{ color: 'var(--label-secondary)' }}>
                                                        <span>Shape Opacity</span>
                                                        <span className="opacity-70">{Math.round((activeTemplate?.settings?.globalDecorationOpacity ?? 1) * 100)}%</span>
                                                    </label>
                                                    <input
                                                        type="range"
                                                        min="0.1" max="1" step="0.1"
                                                        value={activeTemplate?.settings?.globalDecorationOpacity ?? 1}
                                                        onChange={(e) => updateGlobalSettings({ globalDecorationOpacity: parseFloat(e.target.value) })}
                                                        className="w-full accent-blue-500 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Template Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ color: 'var(--label-secondary)' }}
                            >
                                <span className="hidden lg:inline">Tomar como base</span>
                                <ChevronDown size={14} />
                            </button>
                            {showTemplateMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowTemplateMenu(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl border z-20 overflow-hidden"
                                        style={{ background: 'var(--system-background)', borderColor: 'var(--separator-opaque)' }}>
                                        <div className="p-2 border-b" style={{ borderColor: 'var(--separator-opaque)' }}>
                                            <button
                                                onClick={() => { handleNewTemplate(); setShowTemplateMenu(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors font-medium"
                                            >
                                                <Plus size={16} /> Create New
                                            </button>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {templates.map(t => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => { setActiveTemplate(t); setShowTemplateMenu(false); }}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                                    style={{ color: activeTemplate?.id === t.id ? 'var(--system-blue)' : 'var(--label-primary)' }}
                                                >
                                                    <span className="truncate">{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Preview Button */}
                        <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors border hover:bg-gray-50 dark:hover:bg-gray-800"
                            style={{ borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                        >
                            <Eye size={14} />
                            <span className="hidden sm:inline">Preview PDF</span>
                        </button>

                        <button
                            onClick={() => toast.success('Saved successfully!')}
                            className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors shadow-sm shadow-blue-500/20"
                        >
                            Save
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden lg:pl-0">
                    {/* Sidebar - Compact */}
                    <div className="w-16 lg:w-auto h-full z-10 overflow-y-auto custom-scrollbar">
                        <BuilderSidebar />
                    </div>

                    {/* Canvas Area - Maximize space with Paper look */}
                    <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-900">
                        <LiquidGlass className="absolute inset-0 opacity-30 pointer-events-none">
                            <div />
                        </LiquidGlass>

                        {/* Paper Container - Explicit White Background */}
                        <div className="relative z-10 w-full max-w-[210mm] h-full flex flex-col items-center">

                            {/* Decorations Layer (Global for now, overlaying everything) */}
                            <div className="fixed inset-0 pointer-events-none z-0">
                                {/* Global decorations container if needed, but we handle them below in a better way or just here? 
                                    Let's keep the user's preferred "Global Overlay" approach but ensure it works.
                                 */}
                            </div>

                            {/* Main Scroll Area */}
                            <div className="w-full h-full overflow-y-auto custom-scrollbar flex flex-col items-center pt-8 pb-40 relative">

                                {/* Global Decoration Overlay Container - Renders over all pages based on absolute Y */}
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible flex flex-col items-center pt-8">
                                    <div className="relative w-[210mm] h-full flex-none">
                                        {activeTemplate?.decorations?.map(deco => (
                                            <DraggableDecoration
                                                key={deco.id}
                                                decoration={deco}
                                                accentColor={activeTemplate.settings?.accentColor || '#3b82f6'}
                                                globalOpacity={activeTemplate.settings?.globalDecorationOpacity ?? 1}
                                                globalBorderWidth={activeTemplate.settings?.decorationBorderWidth ?? activeTemplate.settings?.globalBorderWidth ?? 0}
                                                onDelete={removeDecoration}
                                                onUpdate={updateDecoration}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Pages List */}
                                {activeTemplate?.pages?.map((page, index) => (
                                    <PageCanvas key={page.id} page={page} pageIndex={index} />
                                ))}

                                {/* Add Page Button Area */}
                                <div className="flex flex-col items-center mt-8 pb-20 gap-4 pointer-events-auto z-20">
                                    {!showAddPageMenu ? (
                                        <button
                                            onClick={() => setShowAddPageMenu(true)}
                                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full shadow-lg border border-dashed border-gray-300 hover:border-blue-300 transition-all font-bold"
                                        >
                                            <Plus size={20} />
                                            Add New Page
                                        </button>
                                    ) : (
                                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 text-center">Select Page Type</h4>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { id: 'presentation', icon: Layout, label: 'Cover' },
                                                    { id: 'content', icon: FileText, label: 'Content' },
                                                    { id: 'summary', icon: Layers, label: 'Summary' },
                                                    { id: 'index', icon: LayoutTemplate, label: 'Index' },
                                                    { id: 'conclusion', icon: Square, label: 'End' },
                                                ].map((type) => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => {
                                                            addPage(type.id as any);
                                                            setShowAddPageMenu(false);
                                                        }}
                                                        className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                                                    >
                                                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-200">
                                                            <type.icon size={20} />
                                                        </div>
                                                        <span className="text-xs font-medium">{type.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="mt-3 pt-3 border-t text-center">
                                                <button
                                                    onClick={() => setShowAddPageMenu(false)}
                                                    className="text-xs text-red-400 hover:text-red-500 font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <TrashZone isActive={!!activeDragItem} />

                <DragOverlay>
                    {activeDragItem ? (
                        <div className="opacity-80 rotate-2 cursor-grabbing">
                            {activeDragItem.isDecoration ? (
                                <div style={{ width: '100px', height: '100px', color: activeTemplate?.settings?.accentColor || '#3b82f6' }}>
                                    {(() => {
                                        switch (activeDragItem.type) {
                                            case 'square': return <div style={{ width: '100%', height: '100%', background: 'currentColor' }}></div>;
                                            case 'circle': return <div style={{ width: '100%', height: '100%', background: 'currentColor', borderRadius: '50%' }}></div>;
                                            case 'triangle':
                                                return (
                                                    <svg viewBox="0 0 100 100" width="100%" height="100%" fill="currentColor">
                                                        <polygon points="50,0 100,100 0,100" />
                                                    </svg>
                                                );
                                            case 'wave_decoration':
                                                return (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Waves size={100} />
                                                    </div>
                                                );
                                            default: return null;
                                        }
                                    })()}
                                </div>
                            ) : activeDragItem.isSidebar ? (
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-blue-200 w-60 flex items-center gap-3">
                                    <Layers size={18} className="text-blue-500" />
                                    <span className="font-medium">Adding Block...</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-white rounded-lg shadow-xl border border-blue-200 w-[210mm]">
                                    Moving Block...
                                </div>
                            )}
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
