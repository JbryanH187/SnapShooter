import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTemplateStore } from '../../stores/templateStore';
import { SortableBlock } from './SortableBlock';
import { ReportPage } from '../../../shared/types';
import { Trash2 } from 'lucide-react';
import { confirm } from '../../utils/toast';

interface PageCanvasProps {
    page: ReportPage;
    pageIndex: number;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({ page, pageIndex }) => {
    const { activeTemplate, removePage } = useTemplateStore();
    const { setNodeRef } = useDroppable({
        id: page.id,
        data: {
            isPage: true,
            pageId: page.id
        }
    });

    if (!activeTemplate) return null;

    const getPageTitle = (type: string) => {
        switch (type) {
            case 'presentation': return 'Presentation';
            case 'content': return 'Content';
            case 'summary': return 'Summary';
            case 'index': return 'Index';
            case 'conclusion': return 'Conclusion';
            default: return 'Page';
        }
    };

    return (
        <div className="flex flex-col items-center mb-8 relative group">
            {/* Page Tag/Label - Liquid Style - Force black text */}
            <div className="absolute -top-10 left-0 flex items-center gap-2 z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl bg-white/90 border border-gray-200 shadow-lg transition-transform hover:scale-105">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        {getPageTitle(page.type)}
                    </span>
                    <span className="w-px h-3 bg-gray-300 mx-1"></span>
                    <span className="text-xs font-mono text-blue-600">#{pageIndex + 1}</span>
                </div>

                {/* Remove Page Button */}
                <button
                    onClick={async () => {
                        const confirmed = await confirm({
                            title: 'Remove Page',
                            text: 'Are you sure you want to remove this page? All blocks inside will be deleted.',
                            confirmText: 'Remove',
                            cancelText: 'Cancel',
                            type: 'danger'
                        });
                        if (confirmed) {
                            removePage(page.id);
                        }
                    }}
                    className="p-2 rounded-full bg-white/90 border border-gray-200 shadow-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                    title="Remove Page"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Paper Container - Explicit White Background */}
            <div className="relative z-10 w-[210mm] min-w-[210mm] shadow-2xl transition-all flex-none">
                {/* Canvas Container */}
                <div
                    ref={setNodeRef}
                    className="w-full relative bg-white transition-all overflow-hidden flex flex-col"
                    style={{
                        minHeight: '297mm', // A4 Paper simulation
                        backgroundColor: '#ffffff' // Force white
                    }}>

                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="w-full h-full"
                            style={{
                                opacity: activeTemplate?.background?.opacity ?? 0.5,
                                backgroundColor: activeTemplate?.background?.color || 'transparent',
                                backgroundImage: activeTemplate?.background?.pattern === 'grid-dots'
                                    ? 'radial-gradient(circle, #000 1px, transparent 1px)'
                                    : activeTemplate?.background?.pattern === 'circles'
                                        ? 'radial-gradient(circle, #000 2px, transparent 2px)'
                                        : 'none',
                                backgroundSize: '20px 20px'
                            }}
                        />
                    </div>

                    {/* Block Content */}
                    <div className="relative z-10 w-full h-full p-8 pb-32">
                        <SortableContext
                            items={page.blocks.map(b => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {page.blocks.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl mt-10 pointer-events-auto">
                                    <p>Drop blocks here</p>
                                </div>
                            ) : (
                                page.blocks.map((block) => (
                                    <SortableBlock key={block.id} block={block} />
                                ))
                            )}
                        </SortableContext>
                    </div>
                </div>
            </div>
        </div>
    );
};
