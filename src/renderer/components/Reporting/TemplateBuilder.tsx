import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateBuilderStore } from '../../stores/templateBuilderStore';
import { useCaptureStore } from '../../stores/captureStore';
import {
    Save,
    X,
    Wand2,
    Layout,
    Palette,
    Type,
    Settings,
    Eye,
    Grid3x3,
    List,
    Columns
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface TemplateBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    captureIds?: string[];
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
    isOpen,
    onClose,
    captureIds = []
}) => {
    const { currentTemplate, updateTemplate, saveTemplate, createNewTemplate } = useTemplateBuilderStore();
    const { captures } = useCaptureStore();
    const [activeTab, setActiveTab] = useState<'layout' | 'style' | 'content'>('layout');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    React.useEffect(() => {
        if (isOpen && !currentTemplate) {
            createNewTemplate();
            if (captureIds.length > 0) {
                updateTemplate({ captureOrder: captureIds });
            }
        }
    }, [isOpen]);

    if (!currentTemplate) return null;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = currentTemplate.captureOrder.indexOf(active.id as string);
        const newIndex = currentTemplate.captureOrder.indexOf(over.id as string);

        const newOrder = arrayMove(currentTemplate.captureOrder, oldIndex, newIndex);
        updateTemplate({ captureOrder: newOrder });
    };

    const handleSave = async () => {
        await saveTemplate();
        onClose();
    };

    const orderedCaptures = currentTemplate.captureOrder
        .map(id => captures.find(c => c.id === id))
        .filter(Boolean);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <Wand2 className="text-primary-500" size={24} />
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Template Builder
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Design your custom report template
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Template Name */}
                            <div className="px-6 pt-4">
                                <input
                                    type="text"
                                    value={currentTemplate.name}
                                    onChange={(e) => updateTemplate({ name: e.target.value })}
                                    placeholder="Template Name"
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
                                <TabButton
                                    active={activeTab === 'layout'}
                                    onClick={() => setActiveTab('layout')}
                                    icon={<Layout size={16} />}
                                    label="Layout"
                                />
                                <TabButton
                                    active={activeTab === 'style'}
                                    onClick={() => setActiveTab('style')}
                                    icon={<Palette size={16} />}
                                    label="Style"
                                />
                                <TabButton
                                    active={activeTab === 'content'}
                                    onClick={() => setActiveTab('content')}
                                    icon={<Settings size={16} />}
                                    label="Content"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'layout' && (
                                    <LayoutTab
                                        template={currentTemplate}
                                        captures={orderedCaptures as any}
                                        onUpdate={updateTemplate}
                                        onDragEnd={handleDragEnd}
                                        sensors={sensors}
                                    />
                                )}
                                {activeTab === 'style' && (
                                    <StyleTab
                                        template={currentTemplate}
                                        onUpdate={updateTemplate}
                                    />
                                )}
                                {activeTab === 'content' && (
                                    <ContentTab
                                        template={currentTemplate}
                                        onUpdate={updateTemplate}
                                    />
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <Eye size={16} />
                                    Preview
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium shadow-sm transition-colors"
                                    >
                                        <Save size={16} />
                                        Save Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Tab Button Component
const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${active
                ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
    >
        {icon}
        {label}
    </button>
);

// Layout Tab - Drag & Drop
const LayoutTab: React.FC<any> = ({ template, captures, onUpdate, onDragEnd, sensors }) => {
    const layoutIcons = {
        grid: <Grid3x3 size={20} />,
        list: <List size={20} />,
        masonry: <Columns size={20} />
    };

    return (
        <div className="space-y-6">
            {/* Layout Type */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Layout Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {(['grid', 'list', 'masonry'] as const).map(layout => (
                        <button
                            key={layout}
                            onClick={() => onUpdate({ layout })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${template.layout === layout
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {layoutIcons[layout]}
                            <span className="text-sm font-medium capitalize">{layout}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Columns (for grid) */}
            {template.layout === 'grid' && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Columns: {template.columnsPerRow}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="4"
                        value={template.columnsPerRow}
                        onChange={(e) => onUpdate({ columnsPerRow: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>
            )}

            {/* Capture Order */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Capture Order ({captures.length} items)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Drag to reorder captures in your report
                </p>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={template.captureOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {captures.map((capture: any, idx: number) => (
                                <div
                                    key={capture.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                    <span className="text-sm font-bold text-gray-500">{idx + 1}</span>
                                    <span className="text-sm flex-1">{capture.title || 'Untitled'}</span>
                                </div>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};

// Style Tab
const StyleTab: React.FC<any> = ({ template, onUpdate }) => {
    const fonts = ['Inter', 'Roboto', 'Montserrat', 'System'];
    const spacings = ['compact', 'normal', 'spacious'];

    return (
        <div className="space-y-6">
            {/* Cover Style */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Cover Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {(['minimal', 'bold', 'image'] as const).map(style => (
                        <button
                            key={style}
                            onClick={() => onUpdate({ coverStyle: style })}
                            className={`p-4 rounded-lg border-2 transition-all capitalize ${template.coverStyle === style
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Family */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Font Family
                </label>
                <select
                    value={template.fontFamily}
                    onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                    {fonts.map(font => (
                        <option key={font} value={font}>{font}</option>
                    ))}
                </select>
            </div>

            {/* Spacing */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Spacing
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {spacings.map(spacing => (
                        <button
                            key={spacing}
                            onClick={() => onUpdate({ spacing })}
                            className={`p-3 rounded-lg border-2 transition-all capitalize ${template.spacing === spacing
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {spacing}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Content Tab
const ContentTab: React.FC<any> = ({ template, onUpdate }) => {
    const options = [
        { key: 'showTimestamps', label: 'Show Timestamps' },
        { key: 'showDescriptions', label: 'Show Descriptions' },
        { key: 'showStepNumbers', label: 'Show Step Numbers' },
        { key: 'includeTableOfContents', label: 'Include Table of Contents' }
    ];

    return (
        <div className="space-y-4">
            {options.map(option => (
                <label
                    key={option.key}
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <input
                        type="checkbox"
                        checked={template[option.key]}
                        onChange={(e) => onUpdate({ [option.key]: e.target.checked })}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                    </span>
                </label>
            ))}
        </div>
    );
};
